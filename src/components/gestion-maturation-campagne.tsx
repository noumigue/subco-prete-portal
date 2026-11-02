'use client';

import { useState, useTransition } from 'react';
import type { ChampModifiable, GenreCampagne, PayloadCampagne, PieceReferentiel, SimulationCampagne } from '@/lib/gestion-api';
import { lancerCampagneMajAction, simulerCampagneMajAction } from '@/app/(gestion)/actions';

// Lancement d'une campagne de demandes.
//
// UNE CAMPAGNE = UN GENRE (arbitrage du 2 novembre 2026). Le Cabinet lance une campagne par
// element a completer, et chacune suit son cours : sa propre echeance, ses relances, sa
// validation. C'est ce qui permet a un operateur de livrer progressivement — une campagne se
// clot quand son objet est servi, independamment des autres. L'ecran ne propose donc pas de
// composer un paquet : il demande d'abord lequel des trois genres on lance, puis seulement
// ce que ce genre exige.
//
// La simulation precede toujours le lancement — meme deroule que les campagnes d'e-mail :
// on voit combien de dossiers seraient servis, lesquels le sont deja, et a quelle echeance,
// avant que le premier courriel ne parte. Elle n'ecrit rien, pas meme le type de demande.
//
// Les dossiers se collent par NUMERO, un par ligne : c'est ce que l'equipe a sous la main,
// pas des identifiants de document. Le CMS resout « 00127 » comme « PRETE-AP-C1-2026-00127 ».

const GENRES: { cle: GenreCampagne; titre: string; aide: string }[] = [
  {
    cle: 'champs',
    titre: 'Modifier le formulaire',
    aide: 'Vous choisissez les champs à rouvrir. L’opérateur ne pourra modifier que ceux-là.',
  },
  {
    cle: 'piece_nouvelle',
    titre: 'Fournir une pièce d’un type nouveau',
    aide: 'Une pièce qui ne figurait pas parmi celles demandées au dépôt. Vous la nommez ici.',
  },
  {
    cle: 'piece_revision',
    titre: 'Fournir une nouvelle version d’une pièce',
    aide: 'La version déposée n’est pas écrasée : la nouvelle s’ajoute, les deux restent consultables.',
  },
];

// Le budget et la contrepartie forment un objet arithmetique : cocher l'un coche l'autre.
// Accepter un nouveau budget en gardant l'ancienne contrepartie changerait la subvention
// a l'insu de tous.
const MONTANTS = ['financement.budgetTotal', 'financement.contrepartie'];

export function GestionMaturationCampagne({
  pieces,
  champsCatalogue,
}: {
  pieces: PieceReferentiel[];
  champsCatalogue: ChampModifiable[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [genre, setGenre] = useState<GenreCampagne>('champs');
  const [champs, setChamps] = useState<string[]>([]);
  const [libellePiece, setLibellePiece] = useState('');
  const [typePieceDocumentId, setTypePiece] = useState('');
  const [campagne, setCampagne] = useState('');
  const [dossiers, setDossiers] = useState('');
  const [joursOuvres, setJours] = useState<number>(5);
  const [echeance, setEcheance] = useState('');
  const [messageOperateur, setMessageOperateur] = useState('');
  const [simulation, setSimulation] = useState<SimulationCampagne | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  const liste = dossiers.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const genreChoisi = GENRES.find((g) => g.cle === genre)!;
  const sections = [...new Set(champsCatalogue.map((c) => c.section))];

  // Un bouton grise n'explique rien. On nomme ce qui manque, dans l'ordre ou l'ecran le demande.
  const manquant: string[] = [];
  if (genre === 'champs' && champs.length === 0) manquant.push('au moins un champ à modifier');
  if (genre === 'piece_nouvelle' && !libellePiece.trim()) manquant.push('le nom de la pièce à fournir');
  if (genre === 'piece_revision' && !typePieceDocumentId) manquant.push('la pièce à réviser');
  if (!campagne.trim()) manquant.push('la clé de campagne');
  if (liste.length === 0) manquant.push('au moins un dossier');
  const pretASimuler = manquant.length === 0;

  function payload(): PayloadCampagne {
    return {
      genre,
      candidatures: liste,
      campagne,
      joursOuvres,
      ...(genre === 'champs' ? { champs } : {}),
      ...(messageOperateur.trim() ? { texteDemande: messageOperateur.trim() } : {}),
      ...(genre === 'piece_nouvelle' ? { libellePiece: libellePiece.trim() } : {}),
      ...(genre === 'piece_revision' ? { typePieceDocumentId } : {}),
    };
  }

  // Changer de genre invalide l'apercu : il decrivait un autre objet.
  function choisirGenre(g: GenreCampagne) {
    setGenre(g);
    setChamps([]);
    setSimulation(null);
    setErreur(null);
    setMessage(null);
  }

  function basculerChamp(cle: string) {
    setSimulation(null);
    setChamps((actuels) => {
      const vise = MONTANTS.includes(cle) ? MONTANTS : [cle];
      const deja = actuels.includes(cle);
      return deja ? actuels.filter((c) => !vise.includes(c)) : [...new Set([...actuels, ...vise])];
    });
  }

  function simuler() {
    setErreur(null); setMessage(null);
    startTransition(async () => {
      try {
        const r = await simulerCampagneMajAction(payload());
        if (r.ok && r.simulation) setSimulation(r.simulation);
        else { setSimulation(null); setErreur(r.error || 'La simulation a échoué.'); }
      } catch (e) {
        // Sans ce filet, une action serveur qui leve ne produit RIEN a l'ecran : ni resultat,
        // ni message. L'operateur clique et croit l'ecran casse.
        setSimulation(null);
        setErreur(`La simulation n’a pas abouti : ${e instanceof Error ? e.message : 'erreur inattendue'}.`);
      }
    });
  }

  function lancer() {
    setErreur(null); setMessage(null);
    startTransition(async () => {
      try {
        const r = await lancerCampagneMajAction({
          ...payload(),
          ...(echeance ? { echeance: new Date(`${echeance}T21:59:00Z`).toISOString() } : {}),
        });
        if (r.ok) {
          setMessage(`${r.creees} demande(s) créée(s)${r.ignorees?.length ? ` · ${r.ignorees.length} déjà servi(s)` : ''}.`);
          setSimulation(null);
        } else setErreur(r.error || 'Le lancement a échoué.');
      } catch (e) {
        setErreur(`Le lancement n’a pas abouti : ${e instanceof Error ? e.message : 'erreur inattendue'}.`);
      }
    });
  }

  if (!ouvert) {
    return (
      <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setOuvert(true)}>
        Nouvelle campagne
      </button>
    );
  }

  return (
    <article className="gx-card">
      <h2 className="gx-block-title">Nouvelle campagne</h2>
      <p className="gx-meta">
        Une campagne ne demande qu’une seule chose. Pour en demander trois, lancez trois
        campagnes : l’opérateur répond à chacune quand il peut, et chacune a son échéance.
      </p>

      <label htmlFor="mat-genre">Que demande cette campagne ?</label>
      <select id="mat-genre" value={genre} onChange={(e) => choisirGenre(e.target.value as GenreCampagne)}>
        {GENRES.map((g) => (
          <option key={g.cle} value={g.cle}>{g.titre}</option>
        ))}
      </select>
      <p className="gx-meta">{genreChoisi.aide}</p>

      {genre === 'champs' ? (
        <>
          <label>Champs à rouvrir</label>
          <div className="gx-champs-choix">
            {sections.map((section) => (
              <fieldset key={section} className="gx-champs-groupe">
                <legend>{section}</legend>
                {champsCatalogue.filter((c) => c.section === section).map((c) => (
                  <label key={c.cle} className="gx-champs-ligne">
                    <input
                      type="checkbox"
                      checked={champs.includes(c.cle)}
                      onChange={() => basculerChamp(c.cle)}
                    />
                    <span>{c.libelle}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <p className="gx-meta">
            {champs.length} champ(s) sélectionné(s). Le budget et la contrepartie vont ensemble :
            la subvention se déduit des deux, les rouvrir séparément n’aurait pas de sens.
          </p>
        </>
      ) : null}

      {genre === 'piece_nouvelle' ? (
        <>
          <label htmlFor="mat-libelle">Nom de la pièce à fournir</label>
          <input
            id="mat-libelle"
            type="text"
            value={libellePiece}
            placeholder="Plan de financement"
            onChange={(e) => setLibellePiece(e.target.value)}
          />
          <p className="gx-meta">
            C’est le nom que l’opérateur verra. Il n’est pas ajouté à la liste des pièces
            demandées à la candidature : les dossiers déjà déposés ne s’en trouvent pas incomplets.
          </p>
        </>
      ) : null}

      {genre === 'piece_revision' ? (
        <>
          <label htmlFor="mat-piece">Pièce dont on veut une nouvelle version</label>
          <select id="mat-piece" value={typePieceDocumentId} onChange={(e) => setTypePiece(e.target.value)}>
            <option value="">— choisir —</option>
            {pieces.map((p) => (
              <option key={p.documentId} value={p.documentId}>{p.libelle}</option>
            ))}
          </select>
        </>
      ) : null}

      <label htmlFor="mat-cle">Clé de campagne</label>
      <input
        id="mat-cle"
        type="text"
        value={campagne}
        placeholder="matur-plan-financement"
        onChange={(e) => setCampagne(e.target.value)}
      />
      <p className="gx-meta">
        Elle dédoublonne : relancer la même clé ne sert que les dossiers qui n’ont pas encore reçu.
      </p>

      <label htmlFor="mat-dossiers">Dossiers — un numéro par ligne</label>
      <textarea
        id="mat-dossiers"
        rows={5}
        value={dossiers}
        placeholder={'00127\n00043\n00183'}
        onChange={(e) => setDossiers(e.target.value)}
      />
      <p className="gx-meta">{liste.length} dossier(s) saisi(s).</p>

      <label htmlFor="mat-message">Message à l’opérateur <span className="gx-meta">· facultatif</span></label>
      <textarea
        id="mat-message"
        rows={3}
        value={messageOperateur}
        placeholder="À la suite de la séance de travail du 2 novembre…"
        onChange={(e) => setMessageOperateur(e.target.value)}
      />
      <p className="gx-meta">
        Il remplace la phrase automatique dans le courriel. Vous savez souvent <em>pourquoi</em>
        {' '}vous demandez — cette raison vaut mieux qu’une formule.
      </p>

      <label htmlFor="mat-echeance">Échéance — à poser depuis la date du Comité</label>
      <input id="mat-echeance" type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
      <p className="gx-meta">
        Laissée vide, l’échéance tombe à {joursOuvres} jours ouvrés.{' '}
        <input
          type="number"
          min={1}
          max={30}
          value={joursOuvres}
          onChange={(e) => setJours(Number(e.target.value))}
          style={{ width: 70, display: 'inline-block' }}
        />
      </p>

      {simulation ? (
        <div className="gx-mat-simulation">
          <strong>Simulation — rien n’est encore parti.</strong>
          <ul className="gx-plist">
            <li>Objet : <strong>{simulation.objet || simulation.type.libelle}</strong></li>
            <li>{simulation.vises} dossier(s) visé(s), dont <strong>{simulation.aCreer}</strong> à servir</li>
            {simulation.dejaServis.length > 0 ? <li>Déjà servis : {simulation.dejaServis.join(', ')}</li> : null}
            {simulation.demandeEnCours?.length > 0 ? (
              <li className="gx-mat-erreur">
                Une demande sur le même objet est déjà en cours, ces dossiers seront écartés :{' '}
                {simulation.demandeEnCours.join(', ')}
              </li>
            ) : null}
            {simulation.autresDemandesOuvertes ? (
              <li>
                {simulation.autresDemandesOuvertes} demande(s) ouverte(s) sur un <em>autre</em> objet —
                sans effet, elles suivent leur cours.
              </li>
            ) : null}
            {simulation.introuvables?.length > 0 ? (
              <li className="gx-mat-erreur">Introuvables : {simulation.introuvables.join(', ')}</li>
            ) : null}
            <li>Échéance : {new Date(simulation.echeance).toLocaleDateString('fr-FR')}</li>
          </ul>
        </div>
      ) : null}

      {erreur ? <p className="gx-mat-erreur">{erreur}</p> : null}
      {message ? <p className="gx-meta"><strong>{message}</strong></p> : null}

      {!pretASimuler ? (
        <p className="gx-meta">
          Pour simuler, il manque encore <strong>{manquant.join(' et ')}</strong>.
        </p>
      ) : null}

      <div className="gx-actions">
        <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours || !pretASimuler} onClick={simuler}>
          {enCours ? 'Simulation en cours…' : 'Simuler'}
        </button>
        <button
          type="button"
          className="gx-btn gx-btn-primary"
          disabled={enCours || !simulation || simulation.aCreer === 0}
          onClick={lancer}
        >
          Lancer la campagne
        </button>
        <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setOuvert(false)}>
          Fermer
        </button>
      </div>
      <p className="gx-meta">
        Le lancement n’est possible qu’après une simulation : c’est elle qui dit ce qui partira.
        {simulation ? '' : ' Tant qu’elle n’a pas répondu, le bouton de lancement reste inactif.'}
      </p>
    </article>
  );
}
