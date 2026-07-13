'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { GestionAssistanceDetail } from '@/lib/portal-types';
import {
  prendreAssistanceAction,
  libererAssistanceAction,
  repondreAssistanceEquipeAction,
  resoudreAssistanceEquipeAction,
  uploadFileAction,
} from '@/app/(gestion)/actions';
import { StatutPill } from '@/components/gestion-assistance-liste';
import { portalMediaUrl } from '@/lib/portal-media';

// Liste large (grisage Mac) — mêmes formats que le reste du back-office.
const ACCEPT_DOCS = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

function fmtDateTime(v: string | null) {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function GestionAssistanceFil({ detail, userId }: { detail: GestionAssistanceDetail; userId: number }) {
  const [reply, setReply] = useState('');
  const [piece, setPiece] = useState<{ id: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3200); };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) => {
    setBusy(true);
    startTransition(async () => {
      const r = await fn();
      setBusy(false);
      notify(r.ok ? okMsg : (r.error || 'L’action a échoué.'));
      if (r.ok && after) after();
    });
  };

  const closed = detail.statut === 'resolue';
  const mine = detail.priseEnChargePar?.id === userId;

  const onPiece = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('fichier', file);
    const up = await uploadFileAction(fd);
    setUploading(false);
    if (up) { setPiece(up); notify(`Pièce jointe : ${up.name}`); } else notify('Échec du téléversement.');
  };

  return (
    <div className="gx">
      <Link className="gx-back" href="/gestion/assistance">← Assistance</Link>

      <div className="gx-shead">
        <h1>{detail.objet}</h1>
        <div className="gx-shead-sub" style={{ display: 'flex', gap: '6px 14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <StatutPill statut={detail.statut} />
          <b>{detail.operateur}</b>
          {detail.categorie?.libelle ? <span>{detail.categorie.libelle}</span> : null}
          {detail.concerneCandidature ? (
            <>
              <span className="gx-srow-num" style={{ fontSize: 12 }}>{detail.concerneCandidature.numeroDossier || 'Dossier'}</span>
              <Link href={`/gestion/dossiers/${detail.concerneCandidature.documentId}/completude`} style={{ fontWeight: 600 }}>
                voir le dossier ↗
              </Link>
            </>
          ) : detail.concerneSubvention ? (
            <>
              <span className="gx-srow-num" style={{ fontSize: 12 }}>{detail.concerneSubvention.numeroConvention || 'Subvention'}</span>
              <Link href={`/gestion/subventions/${detail.concerneSubvention.documentId}`} style={{ fontWeight: 600 }}>
                voir le dossier de subvention ↗
              </Link>
            </>
          ) : (
            <span>Question générale</span>
          )}
          {detail.origine === 'ugp' ? <span className="gx-tag-origin">ouverte par l&apos;équipe</span> : null}
        </div>
      </div>

      {closed ? (
        <div className="gx-resolved-banner">
          ✓ Résolue{detail.resolueLe ? ` le ${fmtDateTime(detail.resolueLe)}` : ''}
          {detail.resoluePar === 'operateur' ? ' — close par l’opérateur' : detail.resoluePar === 'equipe' ? ' — close par l’équipe' : ''}
        </div>
      ) : mine ? (
        <div className="gx-claimbar mine">
          ✓ Vous avez pris en charge cette demande.
          <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" style={{ marginLeft: 'auto' }} disabled={busy}
            onClick={() => run(() => libererAssistanceAction(detail.documentId), 'Demande libérée')}>
            Libérer
          </button>
        </div>
      ) : detail.priseEnChargePar ? (
        <div className="gx-claimbar">
          Prise en charge par <b>{detail.priseEnChargePar.nom}</b>.
          <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" style={{ marginLeft: 'auto' }} disabled={busy}
            onClick={() => run(() => prendreAssistanceAction(detail.documentId), 'Demande reprise')}>
            Reprendre
          </button>
        </div>
      ) : (
        <div className="gx-claimbar">
          Non prise en charge.
          <button type="button" className="gx-btn gx-btn-gold gx-btn-sm" style={{ marginLeft: 'auto' }} disabled={busy}
            onClick={() => run(() => prendreAssistanceAction(detail.documentId), 'Demande prise en charge')}>
            Je prends en charge
          </button>
        </div>
      )}

      <div className="gx-thread">
        {detail.messages.map((m, i) => (
          <div className={`gx-msg${m.auteur === 'equipe' ? ' is-eq' : ''}`} key={i}>
            <p className="gx-msg-who">
              {m.auteur === 'equipe' ? 'Équipe projet' : detail.operateur}{m.envoyeLe ? ` · ${fmtDateTime(m.envoyeLe)}` : ''}
            </p>
            <div className="gx-msg-bubble">
              {m.corps}
              {m.pieces.map((p, j) => (
                p.url ? (
                  <a key={j} className="gx-pc" style={{ display: 'inline-flex', marginTop: 7 }} href={portalMediaUrl(p.url) || '#'} target="_blank" rel="noopener noreferrer">
                    📎 {p.name || 'pièce jointe'}
                  </a>
                ) : (
                  <span key={j} className="gx-pc" style={{ display: 'inline-flex', marginTop: 7 }}>📎 {p.name || 'pièce jointe'}</span>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      {!closed ? (
        <div className="gx-replybox">
          <textarea rows={3} placeholder="Votre réponse à l’opérateur…" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="gx-reply-actions">
            <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: 'pointer' }}>
              📎 {piece ? piece.name : (uploading ? 'Téléversement…' : 'Joindre un fichier')}
              <input type="file" accept={ACCEPT_DOCS} hidden onChange={(e) => onPiece(e.target.files?.[0])} />
            </label>
            <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || uploading || !reply.trim()}
              onClick={() => run(
                () => repondreAssistanceEquipeAction(detail.documentId, { corps: reply.trim(), pieces: piece ? [piece.id] : undefined }),
                'Réponse envoyée — opérateur notifié',
                () => { setReply(''); setPiece(null); },
              )}>
              Envoyer (notifie l’opérateur)
            </button>
          </div>
          <div className="gx-resolve-line">
            <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy}
              onClick={() => {
                if (window.confirm('Le fil sera clos et ne pourra pas être rouvert. Marquer comme résolue ?')) {
                  run(() => resoudreAssistanceEquipeAction(detail.documentId), 'Demande marquée résolue');
                }
              }}>
              ✓ Marquer résolue
            </button>
          </div>
        </div>
      ) : (
        <p className="gx-annot" style={{ marginTop: 8 }}>
          Demande close (clôture symétrique — par l&apos;opérateur ou l&apos;équipe). Pas de réouverture : une nouvelle demande serait créée.
        </p>
      )}

      <p className="gx-annot">
        <b>Miroir de l&apos;écran opérateur.</b> Réponse de l&apos;équipe → transition <code>en_cours</code> + notification
        (e-mail/SMS + cloche) via le canal existant. Pièces jointes des deux côtés. « Marquer résolue » = clôture équipe
        (l&apos;opérateur peut aussi clore de son côté). Aucun SLA affiché (A5).
      </p>

      {toast ? <div className="gx-toast show">{toast}</div> : null}
    </div>
  );
}
