'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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

// Onglet Evaluation (UGP) : etats de la notation, dans l'ordre du circuit.
type EtatEval = 'a_designer' | 'un_evaluateur' | 'notation' | 'a_consolider' | 'figee';
const ETATS_EVAL: [EtatEval, string, string][] = [
  ['a_designer', 'Évaluateurs à désigner', 'bad'],
  ['un_evaluateur', 'Un seul évaluateur', 'warn'],
  ['notation', 'Notation en cours', 'info'],
  ['a_consolider', 'À consolider', 'ok'],
  ['figee', 'Consolidation figée', 'idle'],
];
// Des evaluateurs designes sans fiche soumise depuis ce nombre de jours : a relancer.
const SANS_FICHE_SEUIL = 3;

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
  if (tabOf(d) === 'evaluation' && d.evaluation) {
    const e = d.evaluation;
    if (e.etat === 'a_designer') return <span className="gx-pill gx-pill-rej">Évaluateurs à désigner</span>;
    if (e.etat === 'un_evaluateur') return <span className="gx-pill gx-pill-val">Un seul évaluateur{e.recuseARemplacer ? ' (récusation)' : ''}</span>;
    if (e.etat === 'notation') return <span className="gx-pill gx-pill-comp">Notation {e.fichesSoumises}/{Math.max(2, e.assignes)} soumise{e.fichesSoumises > 1 ? 's' : ''}</span>;
    if (e.etat === 'a_consolider') return <span className="gx-pill gx-pill-val">À consolider{e.ecartsNonHarmonises ? ` · ${e.ecartsNonHarmonises} écart(s)` : ''}</span>;
    return <span className="gx-pill gx-pill-ok">Figée{e.totalFinal != null ? ` · ${Math.round(e.totalFinal * 10) / 10}/100` : ''}</span>;
  }
  if (d.reexamen) return <span className="gx-pill gx-pill-rej">⟲ Renvoyé de l&apos;évaluation — non-éligibilité à constater</span>;
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

// Une ligne de filtres = une question : libelle dans la colonne de gauche, reponses a droite.
// Les puces restent dans leur colonne quand elles passent a la ligne.
function Ligne({ label, more, children }: { label: string; more?: boolean; children: React.ReactNode }) {
  return (
    <div className={`gx-fz-row${more ? ' gx-fz-more' : ''}`}>
      <span className="gx-fz-lbl">{label}</span>
      <div className="gx-fz-opts">{children}</div>
    </div>
  );
}

type Tri = 'depot_asc' | 'depot_desc' | 'attente' | 'numero' | 'entree_eval';

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
  // sur ses propres dossiers. Ces reglages servent a la 1re visite et a « Tout reinitialiser ».
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
  // Dossiers renvoyes de l'evaluation : a instruire en non-eligibilite.
  const [reexamen, setReexamen] = useState(false);
  const [filiere, setFiliere] = useState('');
  const [province, setProvince] = useState('');
  const [critere, setCritere] = useState('');
  const [verdictSelect, setVerdictSelect] = useState('');
  const [tri, setTri] = useState<Tri>(triDefaut);
  // Onglet Evaluation (UGP) : l'UGP arrive sur les dossiers qui attendent ses evaluateurs.
  const [etatEval, setEtatEval] = useState<'' | EtatEval>('a_designer');
  const [sigRecuse, setSigRecuse] = useState(false);
  const [sigEcart, setSigEcart] = useState(false);
  const [sigEs, setSigEs] = useState(false);
  const [sigSansFiche, setSigSansFiche] = useState(false);
  const [evaluateur, setEvaluateur] = useState('');

  // Onglet et filtres retenus d'une visite a l'autre : apres un rechargement (ou un aller-retour
  // sur un dossier), on revient la ou on travaillait, sans re-cliquer. Memoire LOCALE au
  // navigateur et propre a chaque compte ; « Tout reinitialiser » la remet a zero.
  const MEMOIRE_CLE = `gx-file-v1:${role}:${currentUserId ?? 'anon'}`;
  const restaure = useRef(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(MEMOIRE_CLE);
      if (brut) {
        const v = JSON.parse(brut) as Record<string, unknown>;
        const chaine = (x: unknown) => (typeof x === 'string' ? x : null);
        const bool = (x: unknown) => x === true;
        const onglet = chaine(v.tab);
        if (onglet && TABS.some(([k]) => k === onglet)) setTab(onglet as Tab);
        if (chaine(v.scope)) setScope(v.scope as string);
        if (chaine(v.verdict) !== null) setVerdict(v.verdict as string);
        if (chaine(v.travail) !== null) setTravail(v.travail as '' | Travail);
        setArbitrer(bool(v.arbitrer)); setAttente(bool(v.attente)); setEcheance(bool(v.echeance));
        setModifEnCours(bool(v.modifEnCours)); setPieceAjoutee(bool(v.pieceAjoutee)); setReexamen(bool(v.reexamen));
        if (chaine(v.filiere) !== null) setFiliere(v.filiere as string);
        if (chaine(v.province) !== null) setProvince(v.province as string);
        if (chaine(v.critere) !== null) setCritere(v.critere as string);
        if (chaine(v.verdictSelect) !== null) setVerdictSelect(v.verdictSelect as string);
        if (chaine(v.tri)) setTri(v.tri as Tri);
        if (chaine(v.etatEval) !== null) setEtatEval(v.etatEval as '' | EtatEval);
        setSigRecuse(bool(v.sigRecuse)); setSigEcart(bool(v.sigEcart)); setSigEs(bool(v.sigEs)); setSigSansFiche(bool(v.sigSansFiche));
        if (chaine(v.evaluateur) !== null) setEvaluateur(v.evaluateur as string);
      }
    } catch {
      // Navigation privee ou stockage bloque : on reste sur les reglages par defaut.
    }
    restaure.current = true;
    // Une seule fois, au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restaure.current) return;
    try {
      window.localStorage.setItem(MEMOIRE_CLE, JSON.stringify({
        tab, scope, verdict, travail, arbitrer, attente, echeance, modifEnCours, pieceAjoutee, reexamen,
        filiere, province, critere, verdictSelect, tri, etatEval, sigRecuse, sigEcart, sigEs, sigSansFiche, evaluateur,
      }));
    } catch {
      // Stockage indisponible : la memoire est simplement sans effet.
    }
  }, [MEMOIRE_CLE, tab, scope, verdict, travail, arbitrer, attente, echeance, modifEnCours, pieceAjoutee, reexamen,
    filiere, province, critere, verdictSelect, tri, etatEval, sigRecuse, sigEcart, sigEs, sigSansFiche, evaluateur]);

  function reinitialiser() {
    setRecherche(''); setScope(scopeDefaut); setVerdict(''); setTravail('');
    setArbitrer(false); setAttente(false); setEcheance(false); setModifEnCours(false); setPieceAjoutee(false); setReexamen(false);
    setFiliere(''); setProvince(''); setCritere(''); setVerdictSelect(''); setTri(tab === 'evaluation' && ugp ? 'entree_eval' : triDefaut);
    setEtatEval('a_designer'); setSigRecuse(false); setSigEcart(false); setSigEs(false); setSigSansFiche(false); setEvaluateur('');
    // L'onglet n'est pas touche : on reinitialise les filtres de l'etape ou l'on travaille.
    // La memoire est reecrite par l'effet ci-dessus avec ces valeurs remises a zero.
  }
  function changerOnglet(t: Tab) {
    setTab(t);
    // Les verdicts et l'avancement ne sont pas les memes d'une etape a l'autre.
    setVerdict(''); setTravail(''); setCritere(''); setVerdictSelect(''); setEvaluateur(''); setReexamen(false);
    // Tri par defaut propre a chaque onglet : entree en evaluation pour l'UGP a l'evaluation.
    if (t === 'evaluation' && ugp) setTri('entree_eval');
    else if (tri === 'entree_eval') setTri(triDefaut);
  }

  const estAMoi = (d: GestionDossierRow) => currentUserId != null && d.prisEnChargePar?.id === currentUserId;
  const etapeInstruite = tab === 'completude' || tab === 'eligibilite';
  const etapeEval = ugp && tab === 'evaluation';

  // Listes de « Plus de critères », tirees des dossiers eux-memes.
  const options = useMemo(() => {
    const f = new Set<string>(), p = new Set<string>(), c = new Set<string>(), ev = new Set<string>();
    for (const d of dossiers) {
      if (d.organisation?.filiere) f.add(d.organisation.filiere);
      if (d.organisation?.province) p.add(d.organisation.province);
      for (const x of d.criteresNonConformes || []) c.add(x);
      for (const e of d.evaluation?.evaluateurs || []) if (e.nom) ev.add(e.nom);
    }
    const trie = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, 'fr'));
    return { filieres: trie(f), provinces: trie(p), criteres: trie(c), evaluateurs: trie(ev) };
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
  if (etapeEval && evaluateur) base = base.filter((d) => (d.evaluation?.evaluateurs || []).some((e) => e.nom === evaluateur));

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

  // Onglet Evaluation (UGP) : etat de la notation.
  const nEtatEval = (e: EtatEval) => base.filter((d) => d.evaluation?.etat === e).length;

  let items = base;
  if (etapeEval && etatEval) items = items.filter((d) => d.evaluation?.etat === etatEval);
  if (vueAValider && verdict) items = items.filter((d) => d.instruction?.verdictPropose === verdict);
  if (etapeInstruite && !ugp && travail) items = items.filter((d) => travailOf(d) === travail);

  // 5. Signaux (cumulables).
  const nArbitrer = items.filter((d) => (d.aArbitrer?.length || 0) > 0).length;
  const nAttente = items.filter((d) => d.enValidation && (d.enAttenteDepuisJours ?? 0) >= ATTENTE_SEUIL).length;
  const nEcheance = items.filter(echeanceProche).length;
  const nModif = items.filter((d) => d.modificationEnCours).length;
  const nAjout = items.filter((d) => d.pieceAjoutee).length;
  const nReexamen = items.filter((d) => d.reexamen).length;
  const sansFiche = (d: GestionDossierRow) => (d.evaluation?.sansFicheDepuisJours ?? -1) >= SANS_FICHE_SEUIL;
  const nRecuse = items.filter((d) => d.evaluation?.recuseARemplacer).length;
  const nEcart = items.filter((d) => (d.evaluation?.ecartsNonHarmonises || 0) > 0).length;
  const nEs = items.filter((d) => d.evaluation?.desaccordEs).length;
  const nSansFiche = items.filter(sansFiche).length;
  if (etapeEval) {
    if (sigRecuse) items = items.filter((d) => d.evaluation?.recuseARemplacer);
    if (sigEcart) items = items.filter((d) => (d.evaluation?.ecartsNonHarmonises || 0) > 0);
    if (sigEs) items = items.filter((d) => d.evaluation?.desaccordEs);
    if (sigSansFiche) items = items.filter(sansFiche);
  }
  if (etapeInstruite) {
    if (arbitrer) items = items.filter((d) => (d.aArbitrer?.length || 0) > 0);
    if (attente) items = items.filter((d) => d.enValidation && (d.enAttenteDepuisJours ?? 0) >= ATTENTE_SEUIL);
    if (echeance) items = items.filter(echeanceProche);
    if (modifEnCours) items = items.filter((d) => d.modificationEnCours);
    if (pieceAjoutee) items = items.filter((d) => d.pieceAjoutee);
    if (reexamen) items = items.filter((d) => d.reexamen);
  }

  // 6. Tri.
  const depot = (d: GestionDossierRow) => d.dateDepot || '';
  items = [...items].sort((a, b) => {
    if (tri === 'depot_desc') return depot(b).localeCompare(depot(a));
    if (tri === 'numero') return String(a.numeroDossier || '').localeCompare(String(b.numeroDossier || ''));
    if (tri === 'entree_eval') return String(a.evaluation?.entreeEvaluationLe || '9').localeCompare(String(b.evaluation?.entreeEvaluationLe || '9')) || depot(a).localeCompare(depot(b));
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
    etapeInstruite && reexamen ? "renvoyés de l'évaluation" : null,
    etapeEval && etatEval ? ETATS_EVAL.find(([k]) => k === etatEval)?.[1].toLowerCase() : null,
    etapeEval && sigRecuse ? 'évaluateur récusé' : null,
    etapeEval && sigEcart ? 'écart à harmoniser' : null,
    etapeEval && sigEs ? 'désaccord E&S' : null,
    etapeEval && sigSansFiche ? `aucune fiche depuis ${SANS_FICHE_SEUIL} j` : null,
    etapeEval && evaluateur ? `évaluateur : ${evaluateur}` : null,
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
        <div className="gx-fz-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Numéro de dossier ou nom de l'organisation (00336, Iterambere…)"
            aria-label="Rechercher un dossier"
          />
        </div>

        <div className="gx-fz-grid">
        {ugp ? (
          etapeInstruite ? (
            <Ligne label="Afficher">
              <Chip on={scope === 'tous'} onClick={() => { setScope('tous'); setVerdict(''); }} n={nTous}>Tous les dossiers</Chip>
              <Chip on={scope === 'a_valider'} onClick={() => setScope('a_valider')} n={aValider.length}>À valider par l&apos;UGP</Chip>
            </Ligne>
          ) : null
        ) : (
          <Ligne label="Afficher">
            <Chip on={scope === 'mes'} onClick={() => setScope('mes')}>Mes dossiers</Chip>
            <Chip on={scope === 'tous'} onClick={() => setScope('tous')}>Tous les dossiers</Chip>
          </Ligne>
        )}

        {vueAValider ? (
          <Ligne label="Verdict proposé">
            <Chip on={!verdict} onClick={() => setVerdict('')} n={base.length}>Tous</Chip>
            {verdicts.map((v) => (
              <Chip key={v} on={verdict === v} onClick={() => setVerdict(v)} dot={v === 'rejet' ? 'bad' : v === 'complements' ? 'warn' : 'ok'} n={nVerdict(v)}>
                {VERDICT_PLURIEL[v]}
              </Chip>
            ))}
          </Ligne>
        ) : null}

        {etapeInstruite && !ugp ? (
          <Ligne label="Mon travail">
            <Chip on={!travail} onClick={() => setTravail('')} n={base.length}>Tous</Chip>
            {travaux.map(([k, label, dot]) => (
              <Chip key={k} on={travail === k} onClick={() => setTravail(k)} dot={dot} n={nTravail(k)}>{label}</Chip>
            ))}
          </Ligne>
        ) : null}

        {etapeInstruite ? (
          <Ligne label="Signaux">
            <Chip on={arbitrer} onClick={() => setArbitrer((v) => !v)} n={nArbitrer}>⚖ À arbitrer</Chip>
            {tab === 'eligibilite' ? (
              <Chip on={reexamen} onClick={() => setReexamen((v) => !v)} n={nReexamen}>⟲ Renvoyés de l&apos;évaluation</Chip>
            ) : null}
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
          </Ligne>
        ) : null}

        {etapeEval ? (
          <Ligne label="Notation">
            <Chip on={!etatEval} onClick={() => setEtatEval('')} n={base.length}>Tous</Chip>
            {ETATS_EVAL.map(([k, label, dot]) => (
              <Chip key={k} on={etatEval === k} onClick={() => setEtatEval(k)} dot={dot} n={nEtatEval(k)}>{label}</Chip>
            ))}
          </Ligne>
        ) : null}
        {etapeEval ? (
          <Ligne label="Signaux">
            <Chip on={sigRecuse} onClick={() => setSigRecuse((v) => !v)} n={nRecuse}>↺ Évaluateur récusé, à remplacer</Chip>
            <Chip on={sigEcart} onClick={() => setSigEcart((v) => !v)} n={nEcart}>⚖ Écart à harmoniser</Chip>
            <Chip on={sigEs} onClick={() => setSigEs((v) => !v)} n={nEs}>⚠ Désaccord E&amp;S à arbitrer</Chip>
            <Chip on={sigSansFiche} onClick={() => setSigSansFiche((v) => !v)} n={nSansFiche}>⏳ Aucune fiche depuis {SANS_FICHE_SEUIL} j</Chip>
          </Ligne>
        ) : null}

        <Ligne label="Plus de critères" more>
          {etapeEval && options.evaluateurs.length ? (
            <select value={evaluateur} onChange={(e) => setEvaluateur(e.target.value)} aria-label="Évaluateur">
              <option value="">Évaluateur : tous</option>
              {options.evaluateurs.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : null}
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
            {ugp && etapeInstruite ? <option value="attente">Trier : attente UGP la plus longue</option> : null}
            {etapeEval ? <option value="entree_eval">Trier : entrée en évaluation la plus ancienne</option> : null}
            <option value="numero">Trier : numéro de dossier</option>
          </select>
        </Ligne>

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
                  {phase === 'evaluation' && d.evaluation?.evaluateurs.length ? (
                    <span>évaluateurs : <b>{d.evaluation.evaluateurs.map((e) => e.nom).join(', ')}</b></span>
                  ) : d.prisEnChargePar ? <span>pris en charge : <b>{d.prisEnChargePar.nom}</b></span> : null}
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

                {phase === 'evaluation' && ugp ? (() => {
                  const e = d.evaluation?.etat;
                  if (e === 'a_consolider' || e === 'figee') {
                    return <Link className={`gx-btn gx-btn-sm ${e === 'a_consolider' ? 'gx-btn-gold' : 'gx-btn-ghost'}`} href={`/gestion/dossiers/${d.documentId}/consolidation`}>{e === 'a_consolider' ? 'Consolider' : 'Consulter'}</Link>;
                  }
                  const designer = !e || e === 'a_designer' || e === 'un_evaluateur';
                  return <Link className={`gx-btn gx-btn-sm ${designer ? 'gx-btn-gold' : 'gx-btn-ghost'}`} href={`/gestion/dossiers/${d.documentId}/evaluation`}>{designer ? 'Désigner' : 'Suivre'}</Link>;
                })() : null}
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
