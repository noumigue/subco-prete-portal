'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GestionDossierRow } from '@/lib/portal-types';
import { priseEnChargeAction, reassignerAction } from '@/app/(gestion)/actions';

type Tab = 'recu' | 'completude' | 'eligibilite' | 'evaluation' | 'clos';

const TABS: [Tab, string][] = [
  ['recu', 'Reçus'],
  ['completude', 'Complétude'],
  ['eligibilite', 'Éligibilité'],
  ['evaluation', 'Évaluation'],
  ['clos', 'Clos'],
];

// Seuil au-dela duquel l'attente est signalee. Le delai du candidat ne court plus pendant ce
// temps (il part de la validation), mais chaque jour d'attente retarde sa reponse.
const ATTENTE_SEUIL = 2;
// Une echeance candidat a 2 jours ou moins (ou depassee) merite l'attention de l'instructeur.
const ECHEANCE_PROCHE_JOURS = 2;

const VERDICT_LABEL: Record<string, string> = {
  complet: 'Complet',
  complements: 'À compléter',
  rejet: 'Rejet',
  eligible: 'Éligible',
};
const VERDICT_PLURIEL: Record<string, string> = {
  complet: 'Complets',
  complements: 'À compléter',
  rejet: 'Rejets',
  eligible: 'Éligibles',
};

function tabOf(d: GestionDossierRow): Tab {
  const g = d.statut?.groupe;
  if (g === 'non_retenu' || g === 'selectionne') return 'clos';
  const p = d.statut?.phase;
  if (p === 'completude') return 'completude';
  if (p === 'eligibilite') return 'eligibilite';
  if (p === 'evaluation') return 'evaluation';
  return 'recu';
}

// Ou en est le travail de l'instructeur sur ce dossier, a l'etape en cours.
type Travail = 'a_instruire' | 'renvoye' | 'propose' | 'pieces_demandees' | 'pieces_recues';
function travailOf(d: GestionDossierRow): Travail {
  const wf = d.instruction?.workflow;
  if (wf === 'renvoye') return 'renvoye';
  if (wf === 'propose' || d.enValidation) return 'propose';
  if (tabOf(d) === 'completude') {
    if (d.complementEnCours) return 'pieces_demandees';
    if (d.complementRecu && wf === 'valide') return 'pieces_recues';
  }
  return 'a_instruire';
}

function jourCourt(jour: string | null | undefined) {
  if (!jour) return '';
  const [a, m, j] = String(jour).slice(0, 10).split('-');
  return a && m && j ? `${j}/${m}` : String(jour);
}

function echeanceProche(d: GestionDossierRow) {
  if (!d.echeanceComplement) return false;
  const limite = new Date();
  limite.setDate(limite.getDate() + ECHEANCE_PROCHE_JOURS);
  return d.echeanceComplement <= limite.toISOString().slice(0, 10);
}

// Recherche insensible a la casse et aux accents (« iterambere » trouve « ITERAMBERE »).
function norm(s: string | null | undefined) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Pill({ d }: { d: GestionDossierRow }) {
  if (tabOf(d) === 'clos') return <span className="gx-pill gx-pill-rej">{d.statutClos || 'Clos'}</span>;
  if (d.instruction?.workflow === 'renvoye') return <span className="gx-pill gx-pill-rej">↩ Renvoyé par l&apos;UGP</span>;
  if (d.enValidation) {
    const j = d.enAttenteDepuisJours ?? null;
    const verdict = d.instruction?.verdictPropose ? VERDICT_LABEL[d.instruction.verdictPropose] : null;
    return (
      <span className={`gx-pill ${j != null && j >= ATTENTE_SEUIL ? 'gx-pill-rej' : 'gx-pill-val'}`}>
        ⏳ À valider (UGP){verdict ? ` · ${verdict}` : ''}{j != null ? ` · ${j === 0 ? "depuis aujourd'hui" : `depuis ${j} j`}` : ''}
      </span>
    );
  }
  // Placé HAUT : c'est un signal actionnable — le candidat modifie son dossier, ne le prenez
  // pas en charge maintenant. La version déposée reste lisible et instruisible, mais elle
  // peut être remplacée d'un instant à l'autre.
  if (d.modificationEnCours) return <span className="gx-pill gx-pill-comp">✎ Modification en cours (candidat)</span>;
  if (d.complementRecu && !d.complementEnCours) return <span className="gx-pill gx-pill-ok">Pièces reçues, à réexaminer</span>;
  if (d.complementEnCours) {
    return (
      <span className={`gx-pill ${echeanceProche(d) ? 'gx-pill-rej' : 'gx-pill-comp'}`}>
        Pièces demandées au candidat{d.echeanceComplement ? ` · jusqu'au ${jourCourt(d.echeanceComplement)}` : ''}
      </span>
    );
  }
  // Signal distinct des précédents : personne n'a rien réclamé, c'est le candidat qui a
  // ajouté une pièce de lui-même avant la clôture. Placé en dernier pour ne jamais masquer
  // un signal sur lequel l'équipe doit agir.
  if (d.pieceAjoutee) return <span className="gx-pill gx-pill-ok">Pièce ajoutée par le candidat</span>;
  return null;
}

function Chip({ on, onClick, dot, children, n }: { on: boolean; onClick: () => void; dot?: string; children: React.ReactNode; n?: number }) {
  return (
    <button type="button" className={`gx-fz-chip${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on}>
      {dot ? <span className={`gx-fz-dot ${dot}`} aria-hidden="true" /> : null}
      {children}
      {n != null ? <span className="gx-n">{n}</span> : null}
    </button>
  );
}

type Tri = 'depot_asc' | 'depot_desc' | 'attente' | 'numero';

export function GestionFile({
  dossiers,
  role,
  currentUserId,
  flash,
  flashError,
}: {
  dossiers: GestionDossierRow[];
  role: 'instructeur' | 'ugp';
  currentUserId: number | null;
  flash: string | null;
  flashError: string | null;
}) {
  const ugp = role === 'ugp';
  // Vue par defaut = le travail du jour : l'UGP arrive sur ce qu'elle a a valider, l'instructeur
  // sur ses propres dossiers. Rien n'est memorise : chaque visite repart de ces reglages.
  const scopeDefaut = ugp ? 'a_valider' : 'mes';
  const triDefaut: Tri = ugp ? 'attente' : 'depot_asc';

  const [tab, setTab] = useState<Tab>('completude');
  const [recherche, setRecherche] = useState('');
  const [scope, setScope] = useState<string>(scopeDefaut);
  const [verdict, setVerdict] = useState('');
  const [travail, setTravail] = useState<'' | Travail>('');
  const [arbitrer, setArbitrer] = useState(false);
  const [attente, setAttente] = useState(false);
  const [echeance, setEcheance] = useState(false);
  const [modifEnCours, setModifEnCours] = useState(false);
  const [pieceAjoutee, setPieceAjoutee] = useState(false);
  const [filiere, setFiliere] = useState('');
  const [province, setProvince] = useState('');
  const [critere, setCritere] = useState('');
  const [verdictSelect, setVerdictSelect] = useState('');
  const [tri, setTri] = useState<Tri>(triDefaut);

  function reinitialiser() {
    setRecherche(''); setScope(scopeDefaut); setVerdict(''); setTravail('');
    setArbitrer(false); setAttente(false); setEcheance(false); setModifEnCours(false); setPieceAjoutee(false);
    setFiliere(''); setProvince(''); setCritere(''); setVerdictSelect(''); setTri(triDefaut);
  }
  function changerOnglet(t: Tab) {
    setTab(t);
    // Les verdicts et l'avancement ne sont pas les memes d'une etape a l'autre.
    setVerdict(''); setTravail(''); setCritere(''); setVerdictSelect('');
  }

  const estAMoi = (d: GestionDossierRow) => currentUserId != null && d.prisEnChargePar?.id === currentUserId;
  const etapeInstruite = tab === 'completude' || tab === 'eligibilite';

  // Listes de « Plus de critères », tirees des dossiers eux-memes.
  const options = useMemo(() => {
    const f = new Set<string>(), p = new Set<string>(), c = new Set<string>();
    for (const d of dossiers) {
      if (d.organisation?.filiere) f.add(d.organisation.filiere);
      if (d.organisation?.province) p.add(d.organisation.province);
      for (const x of d.criteresNonConformes || []) c.add(x);
    }
    const trie = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, 'fr'));
    return { filieres: trie(f), provinces: trie(p), criteres: trie(c) };
  }, [dossiers]);

  // 1. Recherche + « Mes dossiers » (instructeur) : s'appliquent aussi aux compteurs d'onglets.
  //    « Reçus » echappe a « Mes dossiers » : ces dossiers n'appartiennent encore a personne.
  const q = norm(recherche.trim());
  const cherches = q
    ? dossiers.filter((d) => norm(d.numeroDossier).includes(q) || norm(d.organisation?.nom).includes(q) || norm(d.titreProjet).includes(q))
    : dossiers;
  const visibles = cherches.filter((d) => ugp || scope !== 'mes' || tabOf(d) === 'recu' || estAMoi(d));

  const counts: Record<Tab, number> = { recu: 0, completude: 0, eligibilite: 0, evaluation: 0, clos: 0 };
  visibles.forEach((d) => { counts[tabOf(d)] += 1; });

  // 2. « Plus de critères » (filière, province, critère non conforme, verdict).
  let base = visibles.filter((d) => tabOf(d) === tab);
  if (filiere) base = base.filter((d) => d.organisation?.filiere === filiere);
  if (province) base = base.filter((d) => d.organisation?.province === province);
  if (critere) base = base.filter((d) => (d.criteresNonConformes || []).includes(critere));
  if (verdictSelect) base = base.filter((d) => d.instruction?.verdictPropose === verdictSelect);

  // 3. UGP — « Afficher » : tous / à valider (étapes instruites seulement).
  const nTous = base.length;
  const aValider = base.filter((d) => d.enValidation);
  const vueAValider = ugp && etapeInstruite && scope === 'a_valider';
  if (vueAValider) base = aValider;

  // 4. Ligne principale : verdict proposé (UGP) ou avancement du travail (instructeur).
  const verdicts = tab === 'eligibilite' ? ['eligible', 'rejet'] : ['complet', 'complements', 'rejet'];
  const nVerdict = (v: string) => base.filter((d) => d.instruction?.verdictPropose === v).length;
  const travaux: [Travail, string, string][] = tab === 'eligibilite'
    ? [['a_instruire', 'À instruire', 'idle'], ['renvoye', "Renvoyés par l'UGP", 'bad'], ['propose', 'Proposés, en attente UGP', 'info']]
    : [
        ['a_instruire', 'À instruire', 'idle'],
        ['renvoye', "Renvoyés par l'UGP", 'bad'],
        ['propose', 'Proposés, en attente UGP', 'info'],
        ['pieces_demandees', 'Pièces demandées au candidat', 'warn'],
        ['pieces_recues', 'Pièces reçues, à réexaminer', 'ok'],
      ];
  const nTravail = (t: Travail) => base.filter((d) => travailOf(d) === t).length;

  let items = base;
  if (vueAValider && verdict) items = items.filter((d) => d.instruction?.verdictPropose === verdict);
  if (etapeInstruite && !ugp && travail) items = items.filter((d) => travailOf(d) === travail);

  // 5. Signaux (cumulables).
  const nArbitrer = items.filter((d) => (d.aArbitrer?.length || 0) > 0).length;
  const nAttente = items.filter((d) => d.enValidation && (d.enAttenteDepuisJours ?? 0) >= ATTENTE_SEUIL).length;
  const nEcheance = items.filter(echeanceProche).length;
  const nModif = items.filter((d) => d.modificationEnCours).length;
  const nAjout = items.filter((d) => d.pieceAjoutee).length;
  if (etapeInstruite) {
    if (arbitrer) items = items.filter((d) => (d.aArbitrer?.length || 0) > 0);
    if (attente) items = items.filter((d) => d.enValidation && (d.enAttenteDepuisJours ?? 0) >= ATTENTE_SEUIL);
    if (echeance) items = items.filter(echeanceProche);
    if (modifEnCours) items = items.filter((d) => d.modificationEnCours);
    if (pieceAjoutee) items = items.filter((d) => d.pieceAjoutee);
  }

  // 6. Tri.
  const depot = (d: GestionDossierRow) => d.dateDepot || '';
  items = [...items].sort((a, b) => {
    if (tri === 'depot_desc') return depot(b).localeCompare(depot(a));
    if (tri === 'numero') return String(a.numeroDossier || '').localeCompare(String(b.numeroDossier || ''));
    if (tri === 'attente') return (b.enAttenteDepuisJours ?? -1) - (a.enAttenteDepuisJours ?? -1) || depot(a).localeCompare(depot(b));
    return depot(a).localeCompare(depot(b));
  });

  const resume = [
    `${items.length} dossier${items.length > 1 ? 's' : ''}`,
    !ugp && scope === 'mes' ? 'mes dossiers' : null,
    vueAValider ? 'à valider' : null,
    vueAValider && verdict ? VERDICT_PLURIEL[verdict]?.toLowerCase() : null,
    !ugp && travail ? travaux.find(([k]) => k === travail)?.[1].toLowerCase() : null,
    etapeInstruite && arbitrer ? 'à arbitrer' : null,
    etapeInstruite && attente ? `en attente ${ATTENTE_SEUIL} j et plus` : null,
    etapeInstruite && echeance ? 'échéance proche ou dépassée' : null,
    etapeInstruite && modifEnCours ? 'candidat en train de modifier' : null,
    etapeInstruite && pieceAjoutee ? 'pièce ajoutée' : null,
    filiere || null,
    province || null,
    critere ? `non conforme : ${critere}` : null,
    verdictSelect ? `verdict : ${VERDICT_LABEL[verdictSelect]?.toLowerCase()}` : null,
    q ? `« ${recherche.trim()} »` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="gx-page-title">File des dossiers</h1>
          <p className="gx-page-sub">Instruction des candidatures — appel : Cohorte 1.</p>
        </div>
        <label className="gx-filters" style={{ margin: 0 }}>
          <span>Appel</span>
          <select defaultValue="C1"><option value="C1">Cohorte 1</option><option value="all">Tous</option></select>
        </label>
      </div>
      {flash ? <div className="gx-flash">{flash}</div> : null}
      {flashError ? <div className="gx-flash err">{flashError}</div> : null}

      <div className="gx-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={`gx-tab${tab === k ? ' on' : ''}`} onClick={() => changerOnglet(k)}>
            {label} <span className="gx-n">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="gx-fz">
        <label className="gx-fz-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Numéro de dossier ou nom de l'organisation (00336, Iterambere…)"
            aria-label="Rechercher un dossier"
          />
        </label>

        {ugp ? (
          etapeInstruite ? (
            <div className="gx-fz-row">
              <span className="gx-fz-lbl">Afficher</span>
              <Chip on={scope === 'tous'} onClick={() => { setScope('tous'); setVerdict(''); }} n={nTous}>Tous les dossiers</Chip>
              <Chip on={scope === 'a_valider'} onClick={() => setScope('a_valider')} n={aValider.length}>À valider par l&apos;UGP</Chip>
            </div>
          ) : null
        ) : (
          <div className="gx-fz-row">
            <span className="gx-fz-lbl">Afficher</span>
            <Chip on={scope === 'mes'} onClick={() => setScope('mes')}>Mes dossiers</Chip>
            <Chip on={scope === 'tous'} onClick={() => setScope('tous')}>Tous les dossiers</Chip>
          </div>
        )}

        {vueAValider ? (
          <div className="gx-fz-row">
            <span className="gx-fz-lbl">Verdict proposé</span>
            <Chip on={!verdict} onClick={() => setVerdict('')} n={base.length}>Tous</Chip>
            {verdicts.map((v) => (
              <Chip key={v} on={verdict === v} onClick={() => setVerdict(v)} dot={v === 'rejet' ? 'bad' : v === 'complements' ? 'warn' : 'ok'} n={nVerdict(v)}>
                {VERDICT_PLURIEL[v]}
              </Chip>
            ))}
          </div>
        ) : null}

        {etapeInstruite && !ugp ? (
          <div className="gx-fz-row">
            <span className="gx-fz-lbl">Où en est mon travail</span>
            <Chip on={!travail} onClick={() => setTravail('')} n={base.length}>Tous</Chip>
            {travaux.map(([k, label, dot]) => (
              <Chip key={k} on={travail === k} onClick={() => setTravail(k)} dot={dot} n={nTravail(k)}>{label}</Chip>
            ))}
          </div>
        ) : null}

        {etapeInstruite ? (
          <div className="gx-fz-row">
            <span className="gx-fz-lbl">Signaux</span>
            <Chip on={arbitrer} onClick={() => setArbitrer((v) => !v)} n={nArbitrer}>⚖ À arbitrer</Chip>
            {ugp ? (
              <Chip on={attente} onClick={() => setAttente((v) => !v)} n={nAttente}>⏳ En attente {ATTENTE_SEUIL} j et plus</Chip>
            ) : (
              <>
                {tab === 'completude' ? (
                  <Chip on={echeance} onClick={() => setEcheance((v) => !v)} n={nEcheance}>⏰ Échéance candidat dans {ECHEANCE_PROCHE_JOURS} j ou dépassée</Chip>
                ) : null}
                <Chip on={modifEnCours} onClick={() => setModifEnCours((v) => !v)} n={nModif}>✎ Candidat en train de modifier</Chip>
                <Chip on={pieceAjoutee} onClick={() => setPieceAjoutee((v) => !v)} n={nAjout}>＋ Pièce ajoutée par le candidat</Chip>
              </>
            )}
          </div>
        ) : null}

        <div className="gx-fz-row gx-fz-more">
          <span className="gx-fz-lbl">Plus de critères</span>
          <select value={filiere} onChange={(e) => setFiliere(e.target.value)} aria-label="Filière">
            <option value="">Filière : toutes</option>
            {options.filieres.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Province">
            <option value="">Province : toutes</option>
            {options.provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {!ugp && etapeInstruite ? (
            <select value={verdictSelect} onChange={(e) => setVerdictSelect(e.target.value)} aria-label="Verdict proposé">
              <option value="">Verdict proposé : tous</option>
              {verdicts.map((v) => <option key={v} value={v}>{VERDICT_LABEL[v]}</option>)}
            </select>
          ) : null}
          {tab === 'eligibilite' && options.criteres.length ? (
            <select value={critere} onChange={(e) => setCritere(e.target.value)} aria-label="Critère non conforme">
              <option value="">Critère non conforme : tous</option>
              {options.criteres.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : null}
          <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} aria-label="Trier">
            <option value="depot_asc">Trier : dépôt le plus ancien</option>
            <option value="depot_desc">Trier : dépôt le plus récent</option>
            {ugp ? <option value="attente">Trier : attente UGP la plus longue</option> : null}
            <option value="numero">Trier : numéro de dossier</option>
          </select>
        </div>

        <div className="gx-fz-foot">
          <span>{resume}</span>
          <button type="button" onClick={reinitialiser}>↺ Réinitialiser</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="gx-empty">Aucun dossier ne correspond à ces critères. Élargissez les filtres ou réinitialisez-les.</div>
      ) : (
        items.map((d) => {
          const phase = tabOf(d);
          const instructionPath = phase === 'eligibilite' ? 'eligibilite' : 'completude';
          const canInstruire = phase === 'completude' || phase === 'eligibilite';
          const renvoye = d.instruction?.workflow === 'renvoye';
          return (
            <div className="gx-drow" key={d.documentId}>
              <div className="gx-main">
                <div className="gx-num">{d.numeroDossier}</div>
                <div className="gx-who">{d.organisation?.nom}</div>
                <div className="gx-meta">
                  {d.organisation?.filiere ? <span>{d.organisation.filiere}</span> : null}
                  {d.organisation?.province ? <span>{d.organisation.province}</span> : null}
                  {d.dateDepot ? <span>déposé le {new Date(d.dateDepot).toLocaleDateString('fr-FR')}</span> : null}
                  {d.prisEnChargePar ? <span>pris en charge : <b>{d.prisEnChargePar.nom}</b></span> : null}
                </div>
              </div>
              <Pill d={d} />
              {ugp && d.aArbitrer?.length ? (
                <span className="gx-pill gx-pill-rej" title={d.aArbitrer.map((x) => x.message).join('\n')}>
                  ⚖ À arbitrer{d.aArbitrer.length > 1 ? ` (${d.aArbitrer.length})` : ''}
                </span>
              ) : null}
              <div className="gx-actions">
                {phase === 'recu' && role === 'instructeur' ? (
                  <form action={priseEnChargeAction}>
                    <input type="hidden" name="documentId" value={d.documentId} />
                    <button type="submit" className="gx-btn gx-btn-primary gx-btn-sm">Prendre en charge</button>
                  </form>
                ) : null}
                {phase === 'recu' && ugp ? <span className="gx-pill gx-pill-comp">Non pris en charge</span> : null}

                {canInstruire && !d.prisEnChargePar && role === 'instructeur' ? (
                  <form action={priseEnChargeAction}>
                    <input type="hidden" name="documentId" value={d.documentId} />
                    <button type="submit" className="gx-btn gx-btn-primary gx-btn-sm">Prendre en charge</button>
                  </form>
                ) : null}
                {canInstruire && (ugp || estAMoi(d)) ? (
                  <>
                    {ugp && d.prisEnChargePar ? (
                      <form action={reassignerAction}>
                        <input type="hidden" name="documentId" value={d.documentId} />
                        <button type="submit" className="gx-btn gx-btn-ghost gx-btn-sm" title="Réassigner">↺</button>
                      </form>
                    ) : null}
                    <Link
                      className={`gx-btn gx-btn-sm ${d.enValidation && ugp ? 'gx-btn-gold' : renvoye && !ugp ? 'gx-btn-primary' : 'gx-btn-ghost'}`}
                      href={`/gestion/dossiers/${d.documentId}/${instructionPath}`}
                    >
                      {d.enValidation && ugp ? 'Examiner & valider' : renvoye && !ugp ? 'Reprendre' : 'Instruire'}
                    </Link>
                  </>
                ) : null}
                {/* Dossier d'un collegue : consultation seule (l'ecran d'instruction s'ouvre verrouille). */}
                {canInstruire && role === 'instructeur' && d.prisEnChargePar && !estAMoi(d) ? (
                  <Link className="gx-btn gx-btn-ghost gx-btn-sm" href={`/gestion/dossiers/${d.documentId}/${instructionPath}`}>Consulter</Link>
                ) : null}

                {phase === 'evaluation' && ugp ? (
                  <Link className="gx-btn gx-btn-ghost gx-btn-sm" href={`/gestion/dossiers/${d.documentId}/evaluation`}>Évaluation</Link>
                ) : null}
                {phase === 'evaluation' && role === 'instructeur' ? <span className="gx-pill gx-pill-comp">Voir « Mes évaluations »</span> : null}
                {phase === 'clos' ? (
                  <Link className="gx-btn gx-btn-ghost gx-btn-sm" href={`/gestion/dossiers/${d.documentId}/completude`}>Consulter</Link>
                ) : null}
              </div>
            </div>
          );
        })
      )}

      <p className="gx-annot">
        <b>C1 — pool + prise en charge nominative</b> (réassignation UGP via ↺). Les onglets suivent les étapes 8.5→8.10.
        Filtres rangés par question : <b>Afficher</b> (périmètre), puis le <b>verdict proposé</b> (UGP) ou l&apos;<b>avancement du travail</b>
        (instructeur), les <b>signaux</b> cumulables et <b>Plus de critères</b>. L&apos;UGP arrive sur ses dossiers à valider,
        l&apos;instructeur sur les siens ; rien n&apos;est mémorisé d&apos;une visite à l&apos;autre.
      </p>
    </>
  );
}
