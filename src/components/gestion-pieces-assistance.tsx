'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import type { GestionComplement, GestionPieceAssistance } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import { annulerVersementAssistanceAction, verserPieceAssistanceAction } from '@/app/(gestion)/actions';

const VISIBLES = 10;

function jourHeure(v: string | null) {
  if (!v) return '';
  try {
    return new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Pièces envoyées par le candidat dans le module Assistance. Elles ne valent PAS dépôt tant
 * qu'elles ne sont pas versées au dossier : le compteur des compléments et l'échéance ne
 * bougent pas. Le versement (instruction seulement) accepte un fichier pour plusieurs pièces.
 */
export function GestionPiecesAssistance({
  documentId,
  pieces,
  complements = [],
  typePieces = [],
  versable = false,
}: {
  documentId: string;
  pieces: GestionPieceAssistance[];
  complements?: GestionComplement[];
  typePieces?: { id: string; libelle: string }[];
  versable?: boolean;
}) {
  const router = useRouter();
  const [tout, setTout] = useState(false);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const [autre, setAutre] = useState('');
  const [precision, setPrecision] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pieces.length) return null;

  const attendues = complements.filter((c) => c.statut === 'demande');
  const liste = tout ? pieces : pieces.slice(0, VISIBLES);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true); setError(null);
    const r = await fn();
    setPending(false);
    if (r.ok) { setOuvert(null); setChoix([]); setAutre(''); setPrecision(''); router.refresh(); }
    else setError(r.error || 'Action refusée.');
  }

  return (
    <div className="gx-card">
      <div className="gx-block-title">
        Pièces reçues via l&apos;assistance<span className="gx-tot">{pieces.length} fichier(s)</span>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '0 0 10px' }}>
        Envoyées par le candidat dans ses demandes d&apos;assistance. <b>Tant qu&apos;une pièce n&apos;est pas versée au dossier,
        elle ne compte pas</b> : le candidat reste relancé et l&apos;échéance court.
      </p>
      {error ? <div className="gx-flash err">{error}</div> : null}

      {liste.map((p) => (
        <div key={`${p.fileId}-${p.demandeDocumentId}`} style={{ borderTop: '1px solid var(--line-warm)', padding: '9px 0' }}>
          <div className="gx-cpl-row">
            {p.url ? (
              <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(p.url) || '#'} target="_blank" rel="noopener noreferrer" title={`Ouvrir « ${p.nom} »`}>⤓ {p.nom}</a>
            ) : <span className="gx-cpl-wait">Fichier indisponible</span>}
            <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{jourHeure(p.envoyeLe)}</span>
            <Link className="gx-cpl-piece" style={{ fontSize: 12.5 }} href={`/gestion/assistance/${p.demandeDocumentId}`}>{p.demandeObjet} ↗</Link>
            {p.verseeComme.length ? (
              <span className="gx-pill gx-pill-ok" style={{ fontSize: 11 }}>✓ versée : {p.verseeComme.join(' · ')}</span>
            ) : (
              <span className="gx-pill gx-pill-comp" style={{ fontSize: 11 }}>non versée</span>
            )}
            {versable && !p.verseeComme.length ? (
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => { setOuvert(ouvert === p.fileId ? null : p.fileId); setChoix([]); setAutre(''); setPrecision(''); }}>
                Verser au dossier…
              </button>
            ) : null}
          </div>

          {versable && ouvert === p.fileId ? (
            <div className="gx-subform" style={{ marginLeft: 0, marginTop: 8 }}>
              <label>Ce fichier justifie <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(un même fichier peut couvrir plusieurs pièces)</span></label>
              {attendues.length ? attendues.map((c) => (
                <label key={c.documentId} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '3px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={choix.includes(c.documentId)}
                    onChange={(e) => setChoix((prev) => (e.target.checked ? [...prev, c.documentId] : prev.filter((x) => x !== c.documentId)))}
                  />
                  {c.pieceDemandee}
                </label>
              )) : <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '2px 0' }}>Aucune pièce n&apos;est actuellement attendue de ce candidat.</p>}

              <label style={{ marginTop: 8 }}>…ou une autre pièce, hors demande en cours</label>
              <select value={autre} onChange={(e) => setAutre(e.target.value)}>
                <option value="">— aucune —</option>
                {typePieces.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
              </select>

              <label style={{ marginTop: 8 }}>Précision <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(facultative)</span></label>
              <input type="text" value={precision} onChange={(e) => setPrecision(e.target.value)} placeholder="Ex. : pages 1-2 : site ; page 3 : contrepartie" />

              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="gx-btn gx-btn-primary gx-btn-sm"
                  disabled={pending || (!choix.length && !autre)}
                  onClick={() => run(() => verserPieceAssistanceAction({
                    documentId,
                    fileId: p.fileId,
                    complementIds: choix,
                    typePieceIds: autre ? [autre] : [],
                    precision: precision.trim(),
                    demandeDocumentId: p.demandeDocumentId,
                  }))}
                >
                  {pending ? 'Versement…' : 'Verser'}
                </button>
                <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => setOuvert(null)}>Annuler</button>
              </div>
            </div>
          ) : null}
        </div>
      ))}

      {pieces.length > VISIBLES ? (
        <button type="button" className="gx-back" style={{ margin: '8px 0 0', fontSize: 12.5 }} onClick={() => setTout((v) => !v)}>
          {tout ? 'Réduire la liste' : `Voir les ${pieces.length - VISIBLES} autres`}
        </button>
      ) : null}

      {versable ? (
        <div style={{ borderTop: '1px solid var(--line-warm)', marginTop: 10, paddingTop: 10 }}>
          {complements.filter((c) => c.statut === 'fourni' && c.sourceAssistance).map((c) => (
            <div className="gx-cpl-row" key={c.documentId}>
              <span className="gx-pill gx-pill-ok" style={{ fontSize: 11 }}>versée depuis l&apos;assistance</span>
              <span className="gx-cpl-piece">{c.pieceDemandee}</span>
              {c.precision ? <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>« {c.precision} »</span> : null}
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => run(() => annulerVersementAssistanceAction({ documentId, complementId: c.documentId }))}>
                Annuler le versement
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
