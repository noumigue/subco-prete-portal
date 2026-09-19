'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { GestionContradiction, GestionDossierDetail, PortalDonneesProjet } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  prolongerComplementsAction,
  proposerCompletudeAction,
  renvoyerCompletudeAction,
  uploadNotificationSigneeAction,
  validerCompletudeAction,
  verifierCompletudeAction,
} from '@/app/(gestion)/actions';
import { GestionJournal } from '@/components/gestion-journal';

const GROUP_LABEL: Record<string, string> = { administratif: 'Administratives', financier: 'Financières', technique: 'Techniques' };
type Etat = 'presente' | 'absente' | 'non_conforme';
type Verdict = 'complet' | 'complements' | 'rejet' | '';

// Apercu de l'echeance cote ecran. Le serveur refait le calcul a la validation et fait foi :
// ce qui est affiche ici dit « si l'UGP validait aujourd'hui ». Miroir de utils/portal-delais.
function ajouterJoursOuvres(depart: Date, jours: number) {
  const d = new Date(Date.UTC(depart.getFullYear(), depart.getMonth(), depart.getDate(), 12));
  let reste = Math.max(0, Math.floor(jours || 0));
  while (reste > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const n = d.getUTCDay();
    if (n >= 1 && n <= 5) reste -= 1;
  }
  return d.toISOString().slice(0, 10);
}

function jourLisible(jour: string | null | undefined) {
  if (!jour) return '—';
  const [a, m, j] = String(jour).slice(0, 10).split('-');
  return a && m && j ? `${j}/${m}/${a}` : String(jour);
}

export function GestionCompletude({
  dossier,
  role,
  currentUserId,
}: {
  dossier: GestionDossierDetail;
  role: 'instructeur' | 'ugp';
  currentUserId: number | null;
}) {
  const router = useRouter();
  const instr = dossier.instructionCompletude;
  const pieces = dossier.referentiels.typePieces;
  const pieceLabel = useMemo(() => Object.fromEntries(pieces.map((p) => [p.id, p.libelle])), [pieces]);

  // Fichier reellement depose par le candidat, par type de piece. Le depot vit dans
  // `donneesProjet.pieces[].fileId` ; le CMS resout ces ids en URL (`piecesFichiers`).
  // Sans ce croisement, l'instructeur juge la conformite de documents qu'il ne peut pas ouvrir.
  const depots = useMemo(() => {
    const deposees = (dossier.donneesProjet as PortalDonneesProjet | null)?.pieces || [];
    const fichiers = dossier.piecesFichiers || {};
    return Object.fromEntries(
      deposees
        .filter((d) => d.depose && d.fileId)
        .map((d) => [d.id, { url: fichiers[String(d.fileId)]?.url || null, nom: fichiers[String(d.fileId)]?.nom || d.nomFichier || 'Piece deposee' }]),
    ) as Record<string, { url: string | null; nom: string }>;
  }, [dossier.donneesProjet, dossier.piecesFichiers]);

  const nbDeposees = Object.keys(depots).length;

  const validationMode = role === 'ugp' && instr?.workflow === 'propose';
  const proposedWaiting = role !== 'ugp' && instr?.workflow === 'propose';
  // Un instructeur qui n'a pas le dossier en charge le consulte sans pouvoir le modifier. Le
  // serveur refuse deja sa proposition ; decider ici, sur la page, couvre aussi l'acces par
  // adresse directe et lui evite de remplir un formulaire qui serait rejete au dernier clic.
  const lectureSeule = role !== 'ugp' && dossier.prisEnChargePar?.id !== currentUserId;
  const editable = !lectureSeule && !validationMode && !proposedWaiting && dossier.statut?.phase === 'completude';

  const [etats, setEtats] = useState<Record<string, { etat: Etat; note?: string }>>(
    () => (instr?.verdictsPieces as Record<string, { etat: Etat; note?: string }>) || {},
  );
  const [verdict, setVerdict] = useState<Verdict>(instr?.verdictGlobal || '');
  const delaiMin = dossier.referentiels.delaiComplementsMinimumJours ?? 2;
  const [delaiJours, setDelaiJours] = useState<number>(
    instr?.complementsProposes?.delaiJours || dossier.referentiels.delaiComplementsJours || 3,
  );
  // Echeance telle que l'UGP la fixera en validant : proposee par le serveur, modifiable ici.
  const [echeanceValidation, setEcheanceValidation] = useState<string>(dossier.echeancePrevue || '');
  const [prolongOpen, setProlongOpen] = useState(false);
  const [prolongJours, setProlongJours] = useState<number>(dossier.referentiels.delaiComplementsJours || 3);
  const [prolongMotif, setProlongMotif] = useState('');
  const [message, setMessage] = useState<string>(instr?.complementsProposes?.message || '');
  const [motif, setMotif] = useState<string>(instr?.motifRejet || '');
  const [observations, setObservations] = useState<string>(instr?.observationsUgp || '');
  // Contradictions renvoyees par la verification « a blanc » : tant qu'elles sont affichees,
  // l'instructeur choisit entre revenir au dossier et proposer quand meme.
  const [alerte, setAlerte] = useState<GestionContradiction[] | null>(null);
  const contradictions = dossier.contradictionsCompletude || [];
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fautives = pieces.filter((p) => etats[p.id]?.etat === 'absente' || etats[p.id]?.etat === 'non_conforme');
  const [cplPieces, setCplPieces] = useState<Set<string>>(new Set(instr?.complementsProposes?.pieces || fautives.map((p) => p.id)));

  // Pieces deja reclamees au candidat et encore attendues. Tant que l'echeance court, on ne peut
  // que COMPLETER la demande : les autres verdicts attendent le depot ou l'echeance (le serveur
  // refuse de toute facon). Evite de renvoyer les memes pieces et le meme e-mail au candidat.
  const demande = dossier.demandeEnCours;
  const demandeActive = Boolean(demande?.active) && editable;
  const cle = (l: string | undefined) => String(l || '').trim().toLowerCase();
  const dejaDemandees = new Set((demande?.active ? demande.pieces : []).map(cle));
  const estDejaDemandee = (id: string) => dejaDemandees.has(cle(pieceLabel[id]));
  const piecesNouvelles = [...cplPieces].filter((id) => !estDejaDemandee(id));

  function setPiece(id: string, etat: Etat) {
    setAlerte(null);
    setEtats((prev) => ({ ...prev, [id]: { etat, note: prev[id]?.note } }));
    if (etat === 'presente') setCplPieces((s) => { const n = new Set(s); n.delete(id); return n; });
    else setCplPieces((s) => new Set(s).add(id));
  }
  function setNote(id: string, note: string) {
    setAlerte(null);
    setEtats((prev) => ({ ...prev, [id]: { etat: prev[id]?.etat || 'absente', note } }));
  }

  function constatsSaisis() {
    const payloadPieces: Record<string, { etat: string; note?: string }> = {};
    for (const [id, v] of Object.entries(etats)) if (v?.etat) payloadPieces[id] = { etat: v.etat, note: v.note };
    return payloadPieces;
  }

  // 1er temps : verification « a blanc » par le serveur. S'il releve des contradictions,
  // on les montre et on attend le choix de l'instructeur ; sinon on propose directement.
  async function onPropose() {
    setError(null);
    if (!observations.trim()) {
      setError("Les observations à l'attention de l'UGP sont obligatoires (écrivez « RAS » s'il n'y a rien à signaler).");
      return;
    }
    setPending(true);
    const check = await verifierCompletudeAction({
      documentId: dossier.documentId,
      verdictsPieces: constatsSaisis(),
      verdictGlobal: verdict as 'complet' | 'complements' | 'rejet',
      ...(verdict === 'complements' ? { complementsProposes: { pieces: piecesNouvelles, delaiJours, message } } : {}),
    });
    if (!check.ok) {
      setPending(false);
      setError(check.error || 'Vérification impossible.');
      return;
    }
    if (check.contradictions.length) {
      setPending(false);
      setAlerte(check.contradictions);
      return;
    }
    await proposer();
  }

  async function proposer() {
    setError(null);
    setAlerte(null);
    setPending(true);
    const result = await proposerCompletudeAction({
      documentId: dossier.documentId,
      verdictsPieces: constatsSaisis(),
      verdictGlobal: verdict as 'complet' | 'complements' | 'rejet',
      ...(verdict === 'complements' ? { complementsProposes: { pieces: piecesNouvelles, delaiJours, message } } : {}),
      ...(verdict === 'rejet' ? { motifRejet: motif } : {}),
      observationsUgp: observations,
    });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?propose=1');
    else setError(result.error || 'Action refusée.');
  }

  async function onValider() {
    setError(null);
    setPending(true);
    let fileId: number | undefined;
    const file = fileRef.current?.files?.[0];
    if (instr?.verdictGlobal === 'rejet' && file) {
      const fd = new FormData();
      fd.append('fichier', file);
      const uploaded = await uploadNotificationSigneeAction(fd);
      fileId = uploaded?.id;
    }
    const result = await validerCompletudeAction({
      documentId: dossier.documentId,
      notificationDecisionFileId: fileId,
      ...(instr?.verdictGlobal === 'complements' && echeanceValidation ? { echeance: echeanceValidation } : {}),
    });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?valide=1');
    else setError(result.error || 'Validation refusée.');
  }

  async function onProlonger() {
    setError(null);
    setPending(true);
    const result = await prolongerComplementsAction({ documentId: dossier.documentId, jours: prolongJours, motif: prolongMotif });
    setPending(false);
    if (result.ok) { setProlongOpen(false); setProlongMotif(''); router.refresh(); }
    else setError(result.error || 'Prolongation refusée.');
  }

  async function onRenvoyer() {
    setError(null);
    setPending(true);
    const result = await renvoyerCompletudeAction({ documentId: dossier.documentId, commentaire });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?renvoye=1');
    else setError(result.error || 'Renvoi refusé.');
  }

  let currentGroup = '';

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
      <div className="gx-dhead">
        <div>
          <h1>{dossier.organisation?.nom} <span className="gx-num" style={{ fontSize: 13 }}>{dossier.numeroDossier}</span></h1>
          <div className="gx-sub">
            Étape : contrôle de complétude administrative (8.6) · check-list Annexe 11
            {dossier.pdfPermanentUrl ? (
              <> · <a className="gx-back" style={{ margin: 0 }} href={portalMediaUrl(dossier.pdfPermanentUrl) || '#'} target="_blank" rel="noopener">Consulter le dossier ↗</a></>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="gx-flash err">{error}</div> : null}
      {lectureSeule ? (
        <div className="gx-validation-banner">
          👁 <b>Consultation seule.</b>{' '}
          {dossier.prisEnChargePar ? <>Dossier pris en charge par {dossier.prisEnChargePar.nom} : lui seul peut l&apos;instruire.</> : <>Ce dossier n&apos;est pas pris en charge par vous.</>}
        </div>
      ) : null}
      {proposedWaiting && !lectureSeule ? <div className="gx-validation-banner">⏳ <b>En attente de validation UGP.</b> Verdict proposé — aucune modification possible avant la décision de l&apos;UGP.</div> : null}
      {demandeActive ? (
        <div className="gx-validation-banner">
          📬 <b>Pièces attendues du candidat{demande?.echeance ? ` jusqu'au ${jourLisible(demande.echeance)}` : ''} :</b> {demande?.pieces.join(' · ')}.
          {' '}Vous pouvez seulement <b>ajouter une pièce</b> à cette demande. Les autres verdicts seront possibles après le dépôt des pièces ou l&apos;échéance.
        </div>
      ) : null}
      {instr?.workflow === 'renvoye' && instr.commentaireRenvoi ? <div className="gx-validation-banner">↩︎ <b>Renvoyé par l&apos;UGP.</b> {instr.commentaireRenvoi}</div> : null}
      {instr?.workflow === 'propose' && contradictions.length ? (
        <div className="gx-flash err">
          ⚖ <b>À arbitrer.</b> Le verdict proposé contredit les constats de l&apos;instructeur :
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {contradictions.map((c, i) => <li key={i}>{c.message}</li>)}
          </ul>
          Lisez les observations de l&apos;instructeur ci-dessous avant de valider.
        </div>
      ) : null}
      {validationMode ? <div className="gx-validation-banner">⚖️ <b>Mode validation UGP.</b> Verdict proposé par {instr?.proposePar || dossier.prisEnChargePar?.nom}. Votre validation déclenche les effets visibles côté candidat (statut, notification, compléments).</div> : null}

      {/* Check-list des pièces */}
      <div className="gx-card">
        <div className="gx-block-title">Check-list des pièces<span className="gx-tot">{nbDeposees} / {pieces.length} déposées</span></div>
        {pieces.map((p) => {
          const st = etats[p.id]?.etat;
          const showGroup = p.groupe !== currentGroup;
          currentGroup = p.groupe;
          const disabled = !editable;
          return (
            <div key={p.id}>
              {showGroup ? <div className="gx-grp-title">{GROUP_LABEL[p.groupe] || p.groupe}</div> : null}
              <div className="gx-prow">
                <div className="gx-pname">
                  {p.libelle}<div className="gx-exig">{p.exigence}</div>
                  {depots[p.id]?.url ? (
                    <a className="gx-pc gx-pc-dl" href={portalMediaUrl(depots[p.id].url) || '#'} target="_blank" rel="noopener noreferrer" title={`Ouvrir « ${depots[p.id].nom} »`}>⤓ {depots[p.id].nom}</a>
                  ) : (
                    <span className="gx-pc gx-pc-vide">Aucun fichier déposé</span>
                  )}
                </div>
                <span className="gx-triseg">
                  <button type="button" className={st === 'presente' ? 'p' : ''} disabled={disabled} onClick={() => setPiece(p.id, 'presente')}>✔ Présente</button>
                  <button type="button" className={st === 'absente' ? 'a' : ''} disabled={disabled} onClick={() => setPiece(p.id, 'absente')}>✖ Absente</button>
                  <button type="button" className={st === 'non_conforme' ? 'nc' : ''} disabled={disabled} onClick={() => setPiece(p.id, 'non_conforme')}>⚠ Non conforme</button>
                </span>
                {(st === 'absente' || st === 'non_conforme') ? (
                  <div className={`gx-pnote${!disabled && !(etats[p.id]?.note || '').trim() ? ' req' : ''}`}><input type="text" placeholder="Note (motif)…" value={etats[p.id]?.note || ''} disabled={disabled} onChange={(e) => setNote(p.id, e.target.value)} /></div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict — mode proposition (instructeur editable) */}
      {editable ? (
        <div className="gx-card gx-verdict">
          <div className="gx-block-title">Verdict proposé</div>
          <label className={`gx-vopt${verdict === 'complet' ? ' on' : ''}`} style={demandeActive ? { opacity: 0.5 } : undefined}>
            <input type="radio" name="vd" disabled={demandeActive} checked={verdict === 'complet'} onChange={() => { setVerdict('complet'); setAlerte(null); }} />
            <span><b>Complet</b> — le dossier passe à l&apos;analyse d&apos;éligibilité.{demandeActive ? ' (possible après le dépôt des pièces ou l’échéance)' : ''}</span>
          </label>
          <label className={`gx-vopt${verdict === 'complements' ? ' on' : ''}`}>
            <input type="radio" name="vd" checked={verdict === 'complements'} onChange={() => { setVerdict('complements'); setAlerte(null); }} />
            <span><b>{demandeActive ? 'Ajouter une pièce à la demande en cours' : 'Demande de compléments'}</b> — pièces manquantes ou non conformes à fournir.</span>
          </label>
          {verdict === 'complements' ? (
            <div className="gx-subform">
              {fautives.length ? fautives.map((p) => (
                estDejaDemandee(p.id) ? (
                  <label className="gx-pchk" key={p.id} style={{ opacity: 0.6 }}>
                    <input type="checkbox" checked disabled />
                    {p.libelle} <span style={{ fontSize: 11.5, color: 'var(--muted-warm)' }}>— déjà demandée{demande?.echeance ? ` (jusqu'au ${jourLisible(demande.echeance)})` : ''}, ne sera pas renvoyée</span>
                  </label>
                ) : (
                  <label className="gx-pchk" key={p.id}>
                    <input type="checkbox" checked={cplPieces.has(p.id)} onChange={(e) => { setAlerte(null); setCplPieces((s) => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; }); }} />
                    {p.libelle}
                  </label>
                )
              )) : <span style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>Marquez d&apos;abord des pièces ✖ / ⚠ ci-dessus.</span>}
              {demandeActive && !piecesNouvelles.length ? (
                <p style={{ fontSize: 12, color: 'var(--gx-red-tx)', margin: '6px 0 0' }}>Cochez au moins une pièce qui n&apos;est pas déjà demandée : sinon, il n&apos;y a rien de nouveau à envoyer au candidat.</p>
              ) : null}
              <div className="gx-inline2" style={{ marginTop: 9 }}>
                <div>
                  <label>Délai accordé au candidat (jours ouvrés)</label>
                  <input type="number" min={delaiMin} step={1} value={delaiJours}
                    onChange={(e) => { setAlerte(null); setDelaiJours(Math.max(delaiMin, Math.floor(Number(e.target.value) || 0))); }} />
                </div>
                <div><label>Message au candidat</label><input type="text" placeholder="Consigne courte…" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '8px 0 0' }}>
                Le délai court à partir de la <b>validation par l&apos;UGP</b>, au moment où le candidat est prévenu : soit
                jusqu&apos;au <b>{jourLisible(ajouterJoursOuvres(new Date(), delaiJours))}</b> si l&apos;UGP validait aujourd&apos;hui.
                Minimum {delaiMin} jours ouvrés · valeur par défaut réglée dans le référentiel.
              </p>
            </div>
          ) : null}
          <label className={`gx-vopt${verdict === 'rejet' ? ' on' : ''}`} style={demandeActive ? { opacity: 0.5 } : undefined}>
            <input type="radio" name="vd" disabled={demandeActive} checked={verdict === 'rejet'} onChange={() => { setVerdict('rejet'); setAlerte(null); }} />
            <span><b>Rejet</b> — dossier écarté à la complétude (motif obligatoire).{demandeActive ? ' (possible après le dépôt des pièces ou l’échéance)' : ''}</span>
          </label>
          {verdict === 'rejet' ? (
            <div className="gx-subform"><label>Motif</label><textarea rows={2} placeholder="Motif officiel…" value={motif} onChange={(e) => setMotif(e.target.value)} /></div>
          ) : null}
          <div className="gx-subform" style={{ marginLeft: 0, marginTop: 12 }}>
            <label>Observations à l&apos;attention de l&apos;UGP <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — écrivez « RAS » s&apos;il n&apos;y a rien à signaler — non transmises au candidat)</span></label>
            <textarea rows={3} placeholder="Motivez votre choix : pièces partiellement conformes, éléments qui compensent, points à arbitrer… ou « RAS »." value={observations} onChange={(e) => { setObservations(e.target.value); setAlerte(null); }} />
          </div>
          {alerte ? (
            <div className="gx-flash err" style={{ marginTop: 12 }}>
              ⚖ <b>Votre verdict contredit vos constats.</b>
              <ul style={{ margin: '6px 0 6px 18px', padding: 0 }}>
                {alerte.map((c, i) => <li key={i}>{c.message}</li>)}
              </ul>
              Ce dossier sera signalé à l&apos;UGP comme <b>à arbitrer</b>. Votre observation doit expliquer ce choix.
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => setAlerte(null)}>Revenir au dossier</button>
                <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={pending} onClick={proposer}>{pending ? 'Envoi…' : 'Proposer quand même'}</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="gx-btn gx-btn-primary" disabled={!verdict || pending || !observations.trim() || (demandeActive && (verdict !== 'complements' || !piecesNouvelles.length))} onClick={onPropose}>
                {pending ? 'Vérification…' : 'Proposer à la validation UGP'}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Verdict — mode validation (ugp) / lecture (instructeur en attente) */}
      {(validationMode || proposedWaiting) && instr ? (
        <div className="gx-card">
          <div className="gx-block-title">Verdict proposé par l&apos;instructeur</div>
          <div className="gx-recap">
            <b>{instr.verdictGlobal === 'complet' ? 'Complet — passage à l’éligibilité' : instr.verdictGlobal === 'complements' ? 'Demande de compléments' : 'Rejet (complétude)'}</b>
            {instr.verdictGlobal === 'complements' ? (
              <>
                <br />{instr.complementsProposes?.dejaDemandees?.length ? 'Nouvelles pièces (envoyées au candidat)' : 'Pièces'} : {(instr.complementsProposes?.pieces || []).map((id) => pieceLabel[id]).filter(Boolean).join(' · ') || '—'}
                {instr.complementsProposes?.dejaDemandees?.length ? (
                  <><br />Déjà demandées, non renvoyées : {instr.complementsProposes.dejaDemandees.join(' · ')}</>
                ) : null}
                <br />Délai proposé : {instr.complementsProposes?.delaiJours
                  ? `${instr.complementsProposes.delaiJours} jours ouvrés`
                  : `non précisé — délai par défaut appliqué (${dossier.referentiels.delaiComplementsJours} jours ouvrés)`}
                {' · '}Message : {instr.complementsProposes?.message || '—'}
              </>
            ) : null}
            {instr.verdictGlobal === 'rejet' ? <><br />Motif : {instr.motifRejet || '—'}</> : null}
          </div>
          {instr.observationsUgp ? (
            <div className="gx-recap" style={{ marginTop: 10 }}>
              <b>Observations de l&apos;instructeur à l&apos;attention de l&apos;UGP</b>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{instr.observationsUgp}</div>
            </div>
          ) : null}
          {validationMode ? (
            <>
              {instr.verdictGlobal === 'complements' ? (
                <div className="gx-subform" style={{ marginLeft: 0, marginTop: 12 }}>
                  <label>Échéance envoyée au candidat</label>
                  <input type="date" value={echeanceValidation} onChange={(e) => setEcheanceValidation(e.target.value)} />
                  <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '6px 0 0' }}>
                    Calculée à partir d&apos;aujourd&apos;hui et du délai proposé
                    {instr.complementsProposes?.delaiJours ? ` (${instr.complementsProposes.delaiJours} jours ouvrés)` : ''} :
                    le délai du candidat part de <b>votre validation</b>, pas de la date de la proposition. Vous pouvez la modifier
                    (au moins {delaiMin} jours ouvrés).
                  </p>
                </div>
              ) : null}
              {instr.verdictGlobal === 'rejet' ? (
                <div style={{ marginTop: 12 }}><label>Notification de décision signée (optionnel)</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" /></div>
              ) : null}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary" disabled={pending} onClick={onValider}>{pending ? 'Validation…' : 'Valider & notifier'}</button>
                <button type="button" className="gx-btn gx-btn-ghost" disabled={pending} onClick={() => setRenvoiOpen((v) => !v)}>Renvoyer à l&apos;instructeur</button>
              </div>
              {renvoiOpen ? (
                <div className="gx-subform" style={{ marginLeft: 0 }}>
                  <label>Commentaire de renvoi <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — conservé au journal du dossier)</span></label>
                  <textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ce qui doit être revu…" />
                  <div style={{ marginTop: 8 }}><button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending || !commentaire.trim()} onClick={onRenvoyer}>Confirmer le renvoi</button></div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {dossier.depots && dossier.depots.length > 1 ? (
        <div className="gx-card">
          <div className="gx-block-title">Versions déposées
            <span className="gx-m7-r">v{dossier.versionDepot || 1} instruite</span>
          </div>
          {dossier.depots.map((depot) => (
            <div key={depot.version} className="gx-cpl-row">
              <span className={`gx-pill ${depot.version === (dossier.versionDepot || 1) ? 'gx-pill-ok' : 'gx-pill-val'}`}>
                {depot.version === (dossier.versionDepot || 1) ? 'Version instruite' : `Version ${depot.version}`}
              </span>
              <span className="gx-cpl-piece">{depot.titreProjet || '—'}</span>
              <span className="gx-cpl-ech">Déposée le {depot.deposeLe ? new Date(depot.deposeLe).toLocaleDateString('fr-FR') : '—'}</span>
              {depot.pdfUrl ? (
                <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(depot.pdfUrl) || '#'} target="_blank" rel="noopener noreferrer">⤓ PDF de cette version</a>
              ) : <span className="gx-cpl-wait">PDF indisponible</span>}
            </div>
          ))}
          <p className="gx-m7-hint">L&apos;opérateur a redéposé son dossier avant la clôture. Seule la dernière version est instruite ;
            les précédentes sont conservées avec le document qui faisait foi à leur date, et restent opposables.</p>
        </div>
      ) : null}

      {dossier.complements && dossier.complements.length > 0 ? (
        <div className="gx-card">
          <div className="gx-block-title">Compléments demandés &amp; reçus (N2)
            <span className="gx-m7-r">{dossier.complements.filter((c) => c.origine !== 'candidat' && c.statut === 'fourni').length}/{dossier.complements.filter((c) => c.origine !== 'candidat').length} déposé(s)</span>
          </div>
          {dossier.complements.map((c) => (
            <div key={c.documentId} className="gx-cpl-row">
              {c.origine === 'candidat' ? (
                <span className="gx-pill gx-pill-ok">Ajoutée par le candidat</span>
              ) : (
                <span className={`gx-pill ${c.statut === 'fourni' ? 'gx-pill-ok' : 'gx-pill-val'}`}>{c.statut === 'fourni' ? 'Reçu' : 'En attente'}</span>
              )}
              <span className="gx-cpl-piece">{c.pieceDemandee}</span>
              <span className="gx-cpl-ech">{c.origine === 'candidat' ? 'Ajout spontané' : `Échéance : ${jourLisible(c.echeance)}`}</span>
              {c.statut === 'fourni' && c.fichierUrl ? (
                <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(c.fichierUrl) || '#'} target="_blank" rel="noopener noreferrer">⤓ Pièce déposée</a>
              ) : (
                <span className="gx-cpl-wait">En attente du dépôt</span>
              )}
            </div>
          ))}
          {role === 'ugp' && dossier.complements.some((c) => c.statut === 'demande' && c.origine !== 'candidat') ? (
            <div style={{ marginTop: 10 }}>
              {prolongOpen ? (
                <div className="gx-subform" style={{ marginLeft: 0 }}>
                  <label>Nouveau délai (jours ouvrés, à partir d&apos;aujourd&apos;hui)</label>
                  <input type="number" min={delaiMin} step={1} value={prolongJours}
                    onChange={(e) => setProlongJours(Math.max(delaiMin, Math.floor(Number(e.target.value) || 0)))} />
                  <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '6px 0 0' }}>
                    Nouvelle échéance : <b>{jourLisible(ajouterJoursOuvres(new Date(), prolongJours))}</b> — le candidat en est informé par e-mail.
                  </p>
                  <label style={{ marginTop: 8 }}>Motif <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(obligatoire — inscrit au journal et repris dans l&apos;e-mail)</span></label>
                  <textarea rows={2} value={prolongMotif} onChange={(e) => setProlongMotif(e.target.value)} placeholder="Ex. : demande validée après la date initialement prévue." />
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={pending || !prolongMotif.trim()} onClick={onProlonger}>
                      {pending ? 'Envoi…' : 'Prolonger & prévenir le candidat'}
                    </button>
                    <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => setProlongOpen(false)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => setProlongOpen(true)}>Prolonger l&apos;échéance</button>
              )}
            </div>
          ) : null}
          <p className="gx-m7-hint">Dépôt en <b>ajout</b> (le dossier soumis figé n&apos;est jamais altéré). À réception, ré-examinez la complétude.
            Les lignes « Ajoutée par le candidat » n&apos;ont été réclamées par personne : l&apos;opérateur a complété son dossier de lui-même avant la clôture.</p>
        </div>
      ) : null}

      <GestionJournal journal={dossier.journal} />

      <p className="gx-annot">
        <b>Circuit §4.2 (C2).</b> L&apos;instructeur constate pièce par pièce (C3 : présente / absente / non conforme + note) et <b>propose</b> ;
        l&apos;UGP <b>valide &amp; notifie</b> — rien n&apos;est visible côté candidat avant. « Compléments » validés → crée les <code>complement</code>
        (bloc « Action requise » du suivi M4) ; « Complet » → la timeline candidat avance ; « Rejet » → non retenu + notification signée.
        Chaque acte est horodaté et nominatif (8.1.1).
      </p>
    </>
  );
}
