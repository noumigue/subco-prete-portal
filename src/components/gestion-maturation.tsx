'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { GestionDemandeMaj } from '@/lib/gestion-api';
import {
  renvoyerDemandeMajAction,
  rouvrirDemandeMajAction,
  rouvrirLotDemandesMajAction,
  validerDemandeMajAction,
} from '@/app/(gestion)/actions';

// File des demandes de mise a jour, du plus recent au plus ancien.
//
// L'echeance ne dit plus l'ordre des faits depuis que trois campagnes peuvent partir le
// meme jour sur un meme dossier : c'est la date de la demande qui ordonne la file.
//
// Les montants sont valides EN BLOC : budget total, contrepartie et subvention forment un
// seul objet arithmetique, et accepter l'un en refusant l'autre ne voudrait rien dire. Les
// pieces, elles, sont independantes — mais la demande entiere reste ouverte tant que tout
// n'est pas valide, et c'est la validation qui porte les montants dans le dossier.

const LIBELLE: Record<string, string> = {
  demandee: 'À traiter par l’opérateur',
  renvoyee: 'Correction demandée',
  fournie: 'À examiner',
  validee: 'Validée',
  echue: 'Échéance passée',
};

function fr(v?: number | null) {
  return typeof v === 'number' ? new Intl.NumberFormat('fr-FR').format(v) : '—';
}

function dateFr(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
}

function Ligne({ demande }: { demande: GestionDemandeMaj }) {
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [renvoiOuvert, setRenvoiOuvert] = useState(false);

  const montants = demande.montantsProposes;
  const valeurs = demande.valeursDecrites || [];
  const aExaminer = demande.statut === 'fournie';

  function lancer(action: () => Promise<{ ok: boolean; error?: string }>) {
    setErreur(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setErreur(r.error || "L'action a échoué.");
      else setRenvoiOuvert(false);
    });
  }

  return (
    <article className="gx-card">
      <header className="gx-dhead">
        <strong>{demande.candidature?.numeroDossier}</strong>
        <span> — {demande.candidature?.organisation?.nom || demande.candidature?.titreProjet}</span>
        <span className="gx-pill">{LIBELLE[demande.statut] || demande.statut}</span>
      </header>

      <p className="gx-meta">
        {demande.type?.libelle} · échéance {dateFr(demande.echeance)}
        {demande.campagne ? ` · campagne ${demande.campagne}` : ''}
        {demande.soumisLe ? ` · répondu le ${dateFr(demande.soumisLe)}` : ''}
      </p>

      {demande.piecesFournies && demande.piecesFournies.length > 0 ? (
        <ul className="gx-plist">
          {demande.piecesFournies.map((p) => (
            <li key={p.libelle}>
              {p.libelle} —{' '}
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.nomFichier || 'ouvrir le fichier'}
                </a>
              ) : (
                `${p.nomFichier || 'fichier déposé'} (fichier introuvable)`
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {valeurs.length ? (
        <table className="gx-constable">
          <thead>
            <tr><th>Champ</th><th>Au dossier</th><th>Proposé</th></tr>
          </thead>
          <tbody>
            {valeurs.map((v) => (
              <tr key={v.cle}>
                <td>{v.libelle}</td>
                <td>{v.actuelle ?? '—'}</td>
                {/* Ce qui ne bouge pas se lit d'un coup d'oeil : on ne relit pas trois fois
                    la meme valeur pour trouver celle qui a change. */}
                <td>
                  {v.proposee === null || v.proposee === undefined
                    ? <span className="gx-meta">en attente</span>
                    : String(v.proposee) === String(v.actuelle ?? '')
                      ? <span className="gx-meta">inchangé</span>
                      : <strong>{v.proposee}</strong>}
                </td>
              </tr>
            ))}
            {montants ? (
              <tr>
                <td>Subvention qui en découle</td>
                <td>—</td>
                <td>
                  {typeof montants.budgetTotal === 'number' && typeof montants.contrepartie === 'number'
                    ? <strong>{fr(montants.budgetTotal - montants.contrepartie)}</strong>
                    : '—'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      ) : null}

      {montants?.commentaire ? <p className="gx-meta">« {montants.commentaire} »</p> : null}

      {demande.statut === 'validee' ? (
        <p className="gx-meta">
          Validée par {demande.validePar}{demande.valideParRole ? ` (${demande.valideParRole})` : ''} le{' '}
          {dateFr(demande.valideLe)}
          {demande.versionProduite ? ` — version ${demande.versionProduite} du dossier` : ''}
        </p>
      ) : null}

      {erreur ? <p className="gx-mat-erreur">{erreur}</p> : null}

      <div className="gx-actions">
        {aExaminer ? (
          <>
            <button type="button" className="gx-btn gx-btn-primary" disabled={enCours} onClick={() => lancer(() => validerDemandeMajAction(demande.documentId))}>
              Valider
            </button>
            <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours} onClick={() => setRenvoiOuvert((v) => !v)}>
              Renvoyer
            </button>
          </>
        ) : null}
        {demande.statut === 'echue' ? (
          <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours} onClick={() => lancer(() => rouvrirDemandeMajAction(demande.documentId, 3))}>
            Rouvrir (3 jours ouvrés)
          </button>
        ) : null}
      </div>

      {renvoiOuvert ? (
        <div className="gx-mat-renvoi">
          <label htmlFor={`motif-${demande.documentId}`}>Motif du renvoi — il est transmis à l’opérateur</label>
          <textarea
            id={`motif-${demande.documentId}`}
            rows={2}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          <p className="gx-meta">Le renvoi porte une nouvelle échéance de trois jours ouvrés.</p>
          <button
            type="button"
            className="gx-btn gx-btn-gold"
            disabled={enCours || motif.trim().length === 0}
            onClick={() => lancer(() => renvoyerDemandeMajAction(demande.documentId, motif.trim(), 3))}
          >
            Confirmer le renvoi
          </button>
        </div>
      ) : null}
    </article>
  );
}

// Genre d'une demande, y compris celles parties avant que le genre n'existe : leur
// perimetre est fige, on le deduit plutot que de les migrer.
function genreDe(d: GestionDemandeMaj): 'champs' | 'piece_nouvelle' | 'piece_revision' {
  const g = d.perimetre?.genre;
  if (g === 'piece_nouvelle' || g === 'piece_revision' || g === 'champs') return g;
  return d.perimetre?.montants ? 'champs' : 'piece_revision';
}

const GENRE_LIBELLE: Record<string, string> = {
  champs: 'Champs du formulaire',
  piece_nouvelle: 'Pièce d’un type nouveau',
  piece_revision: 'Nouvelle version d’une pièce',
};

const ORDRE_STATUT = ['fournie', 'renvoyee', 'demandee', 'echue', 'validee'];

function Chip({
  on, onClick, n, vide, children,
}: {
  on: boolean; onClick: () => void; n?: number; vide?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`gx-fz-chip${on ? ' on' : ''}${vide ? ' vide' : ''}`}
      onClick={onClick}
      aria-pressed={on}
      disabled={vide}
    >
      {children}
      {n != null ? <span className="gx-n">{n}</span> : null}
    </button>
  );
}

function LigneFiltre({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gx-fz-row">
      <span className="gx-fz-lbl">{label}</span>
      <div className="gx-fz-opts">{children}</div>
    </div>
  );
}

// Combien de demandes on affiche d'emblee. Le chargement n'est pas le probleme — la file
// arrive d'un bloc, comme celle des dossiers — mais peindre un millier de cartes l'est.
// On en revele par paquets, ce qui garde l'ecran reactif sans second aller-retour reseau.
const PAR_PAQUET = 40;

/**
 * Prolongation de delai sur tout ce qui est echu.
 *
 * Le bouton « Rouvrir » de chaque ligne reste la pour un cas isole. Celui-ci sert la
 * decision inverse : quand la mission repousse l'echeance, elle la repousse pour tout le
 * monde, et il ne faut pas que le nombre de clics decide de qui en beneficie.
 */
function Prolonger({ nb, defautEcheance }: { nb: number; defautEcheance: string }) {
  const [jour, setJour] = useState(defautEcheance);
  const [enCours, startTransition] = useTransition();
  const [fait, setFait] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  function prolonger() {
    setErreur(null); setFait(null);
    startTransition(async () => {
      const r = await rouvrirLotDemandesMajAction(jour);
      if (!r.ok) { setErreur(r.error); return; }
      const { rouvertes, echecs, dossiers } = r.resultat;
      setFait(
        `${rouvertes} demande(s) rouverte(s) sur ${dossiers.length} dossier(s), échéance au `
        + `${new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR')}.`
        + (echecs ? ` ${echecs} n’ont pas pu l’être.` : ''),
      );
      router.refresh();
    });
  }

  return (
    <div className="gx-flash">
      <strong>{nb} demande(s) ont dépassé leur échéance.</strong>{' '}
      Les dossiers concernés portent le drapeau « maturation non aboutie » devant le Comité tant
      qu’ils ne sont pas rouverts. Les rouvrir ne prévient pas les opérateurs : le message leur
      expliquant le nouveau délai se fait à part.
      <div className="gx-fz-row" style={{ marginTop: 10 }}>
        <label htmlFor="prolonger-au">Nouvelle échéance</label>
        <input
          id="prolonger-au"
          type="date"
          value={jour}
          onChange={(e) => setJour(e.target.value)}
        />
        <button type="button" className="gx-btn gx-btn-gold" disabled={enCours || !jour} onClick={prolonger}>
          {enCours ? 'Réouverture…' : 'Prolonger tout ce qui est échu'}
        </button>
      </div>
      {erreur ? <p className="gx-mat-erreur">{erreur}</p> : null}
      {fait ? <p className="gx-meta">{fait}</p> : null}
    </div>
  );
}

export function GestionMaturation({
  demandes,
  compte,
  tronque,
  defautEcheance,
}: {
  demandes: GestionDemandeMaj[];
  compte: Record<string, number>;
  tronque?: boolean;
  defautEcheance: string;
}) {
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [genre, setGenre] = useState('');
  const [campagne, setCampagne] = useState('');
  const [visibles, setVisibles] = useState(PAR_PAQUET);

  const campagnes = [...new Set(demandes.map((d) => d.campagne).filter(Boolean) as string[])].sort();

  const q = recherche.trim().toLowerCase();
  const items = demandes.filter((d) => {
    if (statut && d.statut !== statut) return false;
    if (genre && genreDe(d) !== genre) return false;
    if (campagne && d.campagne !== campagne) return false;
    if (!q) return true;
    const foin = [
      d.candidature?.numeroDossier,
      d.candidature?.organisation?.nom,
      d.candidature?.titreProjet,
      d.type?.libelle,
      d.campagne,
    ].filter(Boolean).join(' ').toLowerCase();
    return foin.includes(q);
  });

  // La file arrive deja du plus recent au plus ancien ; on ne la reordonne pas, on la filtre.
  const affichees = items.slice(0, visibles);

  function reinitialiser() {
    setRecherche(''); setStatut(''); setGenre(''); setCampagne(''); setVisibles(PAR_PAQUET);
  }

  const filtre = Boolean(q || statut || genre || campagne);

  return (
    <>
      {tronque ? (
        <div className="gx-flash err">
          La file a atteint sa limite d’affichage : des demandes peuvent manquer. Signalez-le à
          l’équipe projet.
        </div>
      ) : null}

      {compte.echue ? <Prolonger nb={compte.echue} defautEcheance={defautEcheance} /> : null}

      <div className="gx-fz">
        <div className="gx-fz-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setVisibles(PAR_PAQUET); }}
            placeholder="Numéro de dossier, organisation ou clé de campagne"
            aria-label="Rechercher une demande"
          />
        </div>

        <div className="gx-fz-grid">
          <LigneFiltre label="État">
            <Chip on={!statut} onClick={() => { setStatut(''); setVisibles(PAR_PAQUET); }} n={demandes.length}>Toutes</Chip>
            {/* « À examiner » s'affiche MEME A ZERO : c'est l'etat qui appelle une action de
                l'equipe, et son absence laissait croire que le filtre manquait au lieu de
                dire qu'il n'y a rien a faire. Les autres n'apparaissent que s'ils existent. */}
            {ORDRE_STATUT.filter((s) => compte[s] || s === 'fournie').map((s) => (
              <Chip
                key={s}
                on={statut === s}
                vide={!compte[s]}
                onClick={() => { setStatut(s); setVisibles(PAR_PAQUET); }}
                n={compte[s] || 0}
              >
                {LIBELLE[s]}
              </Chip>
            ))}
          </LigneFiltre>

          <LigneFiltre label="Objet">
            <Chip on={!genre} onClick={() => { setGenre(''); setVisibles(PAR_PAQUET); }}>Tous</Chip>
            {Object.entries(GENRE_LIBELLE).map(([g, lib]) => {
              const n = demandes.filter((d) => genreDe(d) === g).length;
              return n ? (
                <Chip key={g} on={genre === g} onClick={() => { setGenre(g); setVisibles(PAR_PAQUET); }} n={n}>{lib}</Chip>
              ) : null;
            })}
          </LigneFiltre>

          {campagnes.length > 1 ? (
            <LigneFiltre label="Campagne">
              {/* Une liste deroulante et non des puces : les cles s'accumulent au fil des
                  vagues, et une rangee de trente puces ne se lit plus. */}
              <select
                value={campagne}
                onChange={(e) => { setCampagne(e.target.value); setVisibles(PAR_PAQUET); }}
                aria-label="Filtrer par campagne"
              >
                <option value="">Toutes les campagnes</option>
                {campagnes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </LigneFiltre>
          ) : null}
        </div>

        <div className="gx-fz-foot">
          <span>
            {items.length} demande(s){filtre ? ` sur ${demandes.length}` : ''}
            {items.length > affichees.length ? ` · ${affichees.length} affichée(s)` : ''}
          </span>
          <button type="button" onClick={reinitialiser}>↺ Réinitialiser</button>
        </div>
      </div>

      {affichees.length === 0 ? (
        <div className="gx-empty">
          {demandes.length === 0
            ? 'Aucune demande de mise à jour pour le moment.'
            : 'Aucune demande ne correspond à ces critères. Élargissez les filtres ou réinitialisez-les.'}
        </div>
      ) : (
        affichees.map((d) => <Ligne key={d.documentId} demande={d} />)
      )}

      {items.length > affichees.length ? (
        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setVisibles((v) => v + PAR_PAQUET)}>
            Afficher {Math.min(PAR_PAQUET, items.length - affichees.length)} demande(s) de plus
          </button>
        </div>
      ) : null}
    </>
  );
}
