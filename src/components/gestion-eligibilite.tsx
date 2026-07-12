'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { GestionDossierDetail } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import {
  proposerEligibiliteAction,
  renvoyerEligibiliteAction,
  uploadNotificationSigneeAction,
  validerEligibiliteAction,
} from '@/app/(gestion)/actions';
import { GestionJournal } from '@/components/gestion-journal';

type Etat = 'conforme' | 'non_conforme';
type Verdict = 'eligible' | 'rejet' | '';

export function GestionEligibilite({ dossier, role }: { dossier: GestionDossierDetail; role: 'instructeur' | 'ugp' }) {
  const router = useRouter();
  const instr = dossier.instructionEligibilite;
  const criteres = dossier.referentiels.criteres;

  const validationMode = role === 'ugp' && instr?.workflow === 'propose';
  const proposedWaiting = role !== 'ugp' && instr?.workflow === 'propose';
  const editable = !validationMode && !proposedWaiting && dossier.statut?.phase === 'eligibilite';

  const [etats, setEtats] = useState<Record<string, { etat: Etat; justification?: string }>>(
    () => (instr?.verdictsCriteres as Record<string, { etat: Etat; justification?: string }>) || {},
  );
  const [verdict, setVerdict] = useState<Verdict>(instr?.verdictGlobal || '');
  const [motif, setMotif] = useState(instr?.motifRejet || '');
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const nbNonConforme = Object.values(etats).filter((v) => v?.etat === 'non_conforme').length;

  function setCrit(id: string, etat: Etat) { setEtats((p) => ({ ...p, [id]: { etat, justification: p[id]?.justification } })); }
  function setJust(id: string, justification: string) { setEtats((p) => ({ ...p, [id]: { etat: p[id]?.etat || 'non_conforme', justification } })); }

  async function onPropose() {
    setError(null);
    // Garde client (C4) : justification obligatoire si non conforme (le serveur revérifie).
    for (const [id, v] of Object.entries(etats)) {
      if (v?.etat === 'non_conforme' && !String(v?.justification || '').trim()) {
        const c = criteres.find((x) => x.id === id);
        setError(`Justification requise pour : ${c?.libelle || 'critère non conforme'}.`);
        return;
      }
    }
    setPending(true);
    const payload: Record<string, { etat: string; justification?: string }> = {};
    for (const [id, v] of Object.entries(etats)) if (v?.etat) payload[id] = { etat: v.etat, justification: v.justification };
    const result = await proposerEligibiliteAction({
      documentId: dossier.documentId,
      verdictsCriteres: payload,
      verdictGlobal: verdict as 'eligible' | 'rejet',
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
    const result = await validerEligibiliteAction({ documentId: dossier.documentId, notificationDecisionFileId: fileId });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?valide=1');
    else setError(result.error || 'Validation refusée.');
  }

  async function onRenvoyer() {
    setError(null);
    setPending(true);
    const result = await renvoyerEligibiliteAction({ documentId: dossier.documentId, commentaire });
    setPending(false);
    if (result.ok) router.push('/gestion/dossiers?renvoye=1');
    else setError(result.error || 'Renvoi refusé.');
  }

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
      <div className="gx-dhead">
        <div>
          <h1>{dossier.organisation?.nom} <span className="gx-num" style={{ fontSize: 13 }}>{dossier.numeroDossier}</span></h1>
          <div className="gx-sub">
            Étape : analyse d&apos;éligibilité (8.7) · grille Annexe 5
            {dossier.pdfPermanentUrl ? (
              <> · <a className="gx-back" style={{ margin: 0 }} href={portalMediaUrl(dossier.pdfPermanentUrl) || '#'} target="_blank" rel="noopener">Consulter le dossier ↗</a></>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="gx-flash err">{error}</div> : null}
      {proposedWaiting ? <div className="gx-validation-banner">⏳ <b>En attente de validation UGP.</b></div> : null}
      {instr?.workflow === 'renvoye' && instr.commentaireRenvoi ? <div className="gx-validation-banner">↩︎ <b>Renvoyé par l&apos;UGP.</b> {instr.commentaireRenvoi}</div> : null}
      {validationMode ? <div className="gx-validation-banner">⚖️ <b>Mode validation UGP.</b> Verdict proposé par {instr?.proposePar || dossier.prisEnChargePar?.nom}.</div> : null}

      <div className="gx-card">
        <div className="gx-block-title">Critères d&apos;éligibilité (§5)</div>
        {criteres.map((c, i) => {
          const st = etats[c.id]?.etat;
          const disabled = !editable;
          return (
            <div className="gx-crow" key={c.id}>
              <div className="gx-cname">{i + 1}. {c.libelle}{c.refManuel ? <span className="gx-ref"> · {c.refManuel}</span> : null}</div>
              <span className="gx-biseg">
                <button type="button" className={st === 'conforme' ? 'c' : ''} disabled={disabled} onClick={() => setCrit(c.id, 'conforme')}>Conforme</button>
                <button type="button" className={st === 'non_conforme' ? 'n' : ''} disabled={disabled} onClick={() => setCrit(c.id, 'non_conforme')}>Non conforme</button>
              </span>
              {st === 'non_conforme' ? (
                <div className={`gx-pnote${!disabled && !(etats[c.id]?.justification || '').trim() ? ' req' : ''}`}><input type="text" placeholder="Justification (obligatoire)…" value={etats[c.id]?.justification || ''} disabled={disabled} onChange={(e) => setJust(c.id, e.target.value)} /></div>
              ) : null}
            </div>
          );
        })}
      </div>

      {editable ? (
        <div className="gx-card gx-verdict">
          <div className="gx-block-title">Verdict proposé</div>
          <label className={`gx-vopt${verdict === 'eligible' ? ' on' : ''}`}>
            <input type="radio" name="ve" checked={verdict === 'eligible'} onChange={() => setVerdict('eligible')} />
            <span><b>Éligible</b> — le dossier passe à l&apos;évaluation technique et financière.</span>
          </label>
          <label className={`gx-vopt${verdict === 'rejet' ? ' on' : ''}`}>
            <input type="radio" name="ve" checked={verdict === 'rejet'} onChange={() => setVerdict('rejet')} />
            <span><b>Rejet motivé</b>{nbNonConforme ? ` — ${nbNonConforme} critère(s) non conforme(s)` : ''}.</span>
          </label>
          {verdict === 'rejet' ? (
            <div className="gx-subform"><label>Motif officiel (synthèse)</label><textarea rows={2} placeholder="Motif communiqué au candidat…" value={motif} onChange={(e) => setMotif(e.target.value)} /></div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="gx-btn gx-btn-primary" disabled={!verdict || pending} onClick={onPropose}>{pending ? 'Envoi…' : 'Proposer à la validation UGP'}</button>
          </div>
        </div>
      ) : null}

      {(validationMode || proposedWaiting) && instr ? (
        <div className="gx-card">
          <div className="gx-block-title">Verdict proposé par l&apos;instructeur</div>
          <div className="gx-recap">
            <b>{instr.verdictGlobal === 'eligible' ? 'Éligible — passage à l’évaluation' : 'Rejet motivé'}</b>
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
        <b>C4.</b> Verdict <b>binaire par critère</b> (justification obligatoire si non conforme) + verdict global éligible / rejet motivé.
        Pas de boucle de compléments à ce stade (elle vit à la complétude). « Éligible » validé → phase évaluation (grille §6, phase 2 du back-office).
      </p>
    </>
  );
}
