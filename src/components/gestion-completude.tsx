'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { GestionDossierDetail } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  proposerCompletudeAction,
  renvoyerCompletudeAction,
  uploadNotificationSigneeAction,
  validerCompletudeAction,
} from '@/app/(gestion)/actions';
import { GestionJournal } from '@/components/gestion-journal';

const GROUP_LABEL: Record<string, string> = { administratif: 'Administratives', financier: 'Financières', technique: 'Techniques' };
type Etat = 'presente' | 'absente' | 'non_conforme';
type Verdict = 'complet' | 'complements' | 'rejet' | '';

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + (days || 10));
  return d.toISOString().slice(0, 10);
}

export function GestionCompletude({ dossier, role }: { dossier: GestionDossierDetail; role: 'instructeur' | 'ugp' }) {
  const router = useRouter();
  const instr = dossier.instructionCompletude;
  const pieces = dossier.referentiels.typePieces;
  const pieceLabel = useMemo(() => Object.fromEntries(pieces.map((p) => [p.id, p.libelle])), [pieces]);

  const validationMode = role === 'ugp' && instr?.workflow === 'propose';
  const proposedWaiting = role !== 'ugp' && instr?.workflow === 'propose';
  const editable = !validationMode && !proposedWaiting && dossier.statut?.phase === 'completude';

  const [etats, setEtats] = useState<Record<string, { etat: Etat; note?: string }>>(
    () => (instr?.verdictsPieces as Record<string, { etat: Etat; note?: string }>) || {},
  );
  const [verdict, setVerdict] = useState<Verdict>(instr?.verdictGlobal || '');
  const [echeance, setEcheance] = useState<string>(instr?.complementsProposes?.echeance || addDays(dossier.referentiels.delaiComplementsJours));
  const [message, setMessage] = useState<string>(instr?.complementsProposes?.message || '');
  const [motif, setMotif] = useState<string>(instr?.motifRejet || '');
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fautives = pieces.filter((p) => etats[p.id]?.etat === 'absente' || etats[p.id]?.etat === 'non_conforme');
  const [cplPieces, setCplPieces] = useState<Set<string>>(new Set(instr?.complementsProposes?.pieces || fautives.map((p) => p.id)));

  function setPiece(id: string, etat: Etat) {
    setEtats((prev) => ({ ...prev, [id]: { etat, note: prev[id]?.note } }));
    if (etat === 'presente') setCplPieces((s) => { const n = new Set(s); n.delete(id); return n; });
    else setCplPieces((s) => new Set(s).add(id));
  }
  function setNote(id: string, note: string) {
    setEtats((prev) => ({ ...prev, [id]: { etat: prev[id]?.etat || 'absente', note } }));
  }

  async function onPropose() {
    setError(null);
    setPending(true);
    const payloadPieces: Record<string, { etat: string; note?: string }> = {};
    for (const [id, v] of Object.entries(etats)) if (v?.etat) payloadPieces[id] = { etat: v.etat, note: v.note };
    const result = await proposerCompletudeAction({
      documentId: dossier.documentId,
      verdictsPieces: payloadPieces,
      verdictGlobal: verdict as 'complet' | 'complements' | 'rejet',
      ...(verdict === 'complements' ? { complementsProposes: { pieces: [...cplPieces], echeance, message } } : {}),
      ...(verdict === 'rejet' ? { motifRejet: motif } : {}),
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
    const result = await validerCompletudeAction({ documentId: dossier.documentId, notificationDecisionFileId: fileId });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?valide=1');
    else setError(result.error || 'Validation refusée.');
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
      {proposedWaiting ? <div className="gx-validation-banner">⏳ <b>En attente de validation UGP.</b> Verdict proposé — aucune modification possible avant la décision de l&apos;UGP.</div> : null}
      {instr?.workflow === 'renvoye' && instr.commentaireRenvoi ? <div className="gx-validation-banner">↩︎ <b>Renvoyé par l&apos;UGP.</b> {instr.commentaireRenvoi}</div> : null}
      {validationMode ? <div className="gx-validation-banner">⚖️ <b>Mode validation UGP.</b> Verdict proposé par {instr?.proposePar || dossier.prisEnChargePar?.nom}. Votre validation déclenche les effets visibles côté candidat (statut, notification, compléments).</div> : null}

      {/* Check-list des pièces */}
      <div className="gx-card">
        <div className="gx-block-title">Check-list des pièces</div>
        {pieces.map((p) => {
          const st = etats[p.id]?.etat;
          const showGroup = p.groupe !== currentGroup;
          currentGroup = p.groupe;
          const disabled = !editable;
          return (
            <div key={p.id}>
              {showGroup ? <div className="gx-grp-title">{GROUP_LABEL[p.groupe] || p.groupe}</div> : null}
              <div className="gx-prow">
                <div className="gx-pname">{p.libelle}<div className="gx-exig">{p.exigence}</div></div>
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
          <label className={`gx-vopt${verdict === 'complet' ? ' on' : ''}`}>
            <input type="radio" name="vd" checked={verdict === 'complet'} onChange={() => setVerdict('complet')} />
            <span><b>Complet</b> — le dossier passe à l&apos;analyse d&apos;éligibilité.</span>
          </label>
          <label className={`gx-vopt${verdict === 'complements' ? ' on' : ''}`}>
            <input type="radio" name="vd" checked={verdict === 'complements'} onChange={() => setVerdict('complements')} />
            <span><b>Demande de compléments</b> — pièces manquantes ou non conformes à fournir.</span>
          </label>
          {verdict === 'complements' ? (
            <div className="gx-subform">
              {fautives.length ? fautives.map((p) => (
                <label className="gx-pchk" key={p.id}>
                  <input type="checkbox" checked={cplPieces.has(p.id)} onChange={(e) => setCplPieces((s) => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; })} />
                  {p.libelle}
                </label>
              )) : <span style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>Marquez d&apos;abord des pièces ✖ / ⚠ ci-dessus.</span>}
              <div className="gx-inline2" style={{ marginTop: 9 }}>
                <div><label>Échéance</label><input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></div>
                <div><label>Message au candidat</label><input type="text" placeholder="Consigne courte…" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '8px 0 0' }}>Délai par défaut issu du référentiel (à confirmer UGP — Annexe 11).</p>
            </div>
          ) : null}
          <label className={`gx-vopt${verdict === 'rejet' ? ' on' : ''}`}>
            <input type="radio" name="vd" checked={verdict === 'rejet'} onChange={() => setVerdict('rejet')} />
            <span><b>Rejet</b> — dossier écarté à la complétude (motif obligatoire).</span>
          </label>
          {verdict === 'rejet' ? (
            <div className="gx-subform"><label>Motif</label><textarea rows={2} placeholder="Motif officiel…" value={motif} onChange={(e) => setMotif(e.target.value)} /></div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="gx-btn gx-btn-primary" disabled={!verdict || pending} onClick={onPropose}>
              {pending ? 'Envoi…' : 'Proposer à la validation UGP'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Verdict — mode validation (ugp) / lecture (instructeur en attente) */}
      {(validationMode || proposedWaiting) && instr ? (
        <div className="gx-card">
          <div className="gx-block-title">Verdict proposé par l&apos;instructeur</div>
          <div className="gx-recap">
            <b>{instr.verdictGlobal === 'complet' ? 'Complet — passage à l’éligibilité' : instr.verdictGlobal === 'complements' ? 'Demande de compléments' : 'Rejet (complétude)'}</b>
            {instr.verdictGlobal === 'complements' ? (
              <><br />Pièces : {(instr.complementsProposes?.pieces || []).map((id) => pieceLabel[id]).filter(Boolean).join(' · ') || '—'}<br />Échéance : {instr.complementsProposes?.echeance || '—'} · Message : {instr.complementsProposes?.message || '—'}</>
            ) : null}
            {instr.verdictGlobal === 'rejet' ? <><br />Motif : {instr.motifRejet || '—'}</> : null}
          </div>
          {validationMode ? (
            <>
              {instr.verdictGlobal === 'rejet' ? (
                <div style={{ marginTop: 12 }}><label>Notification de décision signée (optionnel)</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" /></div>
              ) : null}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="gx-btn gx-btn-primary" disabled={pending} onClick={onValider}>{pending ? 'Validation…' : 'Valider & notifier'}</button>
                <button type="button" className="gx-btn gx-btn-ghost" disabled={pending} onClick={() => setRenvoiOpen((v) => !v)}>Renvoyer à l&apos;instructeur</button>
              </div>
              {renvoiOpen ? (
                <div className="gx-subform" style={{ marginLeft: 0 }}>
                  <label>Commentaire de renvoi</label>
                  <textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ce qui doit être revu…" />
                  <div style={{ marginTop: 8 }}><button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={onRenvoyer}>Confirmer le renvoi</button></div>
                </div>
              ) : null}
            </>
          ) : null}
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
