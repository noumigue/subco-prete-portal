'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GestionNoCas } from '@/lib/portal-types';
import { creerNonObjectionAction, uploadFileAction } from '@/app/(gestion)/actions';

// H/I1 — création d'une demande de non-objection (cas au choix ; le cas « sélection »
// ouvre le parcours outillé, les autres joignent une demande rédigée).
export function GestionNonObjectionNouvelle({ cas }: { cas: GestionNoCas[] }) {
  const router = useRouter();
  const [casDocumentId, setCasDocumentId] = useState('');
  const [objet, setObjet] = useState('');
  const [reference, setReference] = useState('');
  const [piece, setPiece] = useState<{ id: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const onPiece = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('fichier', file);
    let up: { id: number; name: string } | null = null;
    try { up = await uploadFileAction(fd); } catch { up = null; }
    setUploading(false);
    if (up) setPiece(up); else setError('Échec du téléversement — rechargez la page et réessayez.');
  };

  const submit = () => {
    if (!casDocumentId || !objet.trim()) { setError('Le cas et l’objet sont requis.'); return; }
    setError(null);
    setBusy(true);
    startTransition(async () => {
      const r = await creerNonObjectionAction({
        casDocumentId,
        objet: objet.trim(),
        reference: reference.trim() || undefined,
        demandeRedigeeFileId: piece?.id,
      });
      setBusy(false);
      if (r.ok && r.documentId) router.push(`/gestion/non-objection/${r.documentId}`);
      else if (r.ok) router.push('/gestion/non-objection');
      else setError(r.error || 'La création a échoué.');
    });
  };

  return (
    <div className="gx">
      <Link className="gx-back" href="/gestion/non-objection">← Registre</Link>
      <h1 className="gx-page-title">Nouvelle demande de non-objection</h1>
      <p className="gx-page-sub">Choisissez le cas (6.7.1). Le cas « sélection » ouvre le parcours outillé.</p>

      {error ? <div className="gx-flash err">{error}</div> : null}

      <div className="gx-card">
        <label className="gx-label">Cas (référentiel — liste adaptable)</label>
        <select value={casDocumentId} onChange={(e) => setCasDocumentId(e.target.value)}>
          <option value="">— Choisir un cas —</option>
          {cas.map((c) => <option key={c.documentId} value={c.documentId}>{c.code}) {c.libelle}</option>)}
        </select>

        <label className="gx-label">Objet</label>
        <input type="text" value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Ex. Sélection des projets — Cohorte 2" />

        <div className="gx-grid2">
          <div>
            <label className="gx-label">Référence <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(cohorte, décision…)</span></label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cohorte 2" />
          </div>
          <div>
            <label className="gx-label">Demande rédigée <span style={{ fontWeight: 400, color: 'var(--muted-warm)' }}>(cas non outillés)</span></label>
            <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: 'pointer' }}>
              📎 {piece ? piece.name : (uploading ? 'Téléversement…' : 'Joindre')}
              <input type="file" accept=".pdf,.doc,.docx,application/pdf" hidden onChange={(e) => onPiece(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="gx-actions">
          <button type="button" className="gx-btn gx-btn-primary" disabled={busy || uploading} onClick={submit}>
            {busy ? 'Création…' : 'Créer la demande'}
          </button>
        </div>
      </div>

      <p className="gx-annot">
        <b>I1</b> — les 9 cas 6.7.1 viennent du référentiel. Le cas « sélection » (a/b) ouvre les 5 blocs outillés
        (synthèse, paquet, génération Annexe 14, transmission, réponse) ; les autres cas suivent le même circuit de suivi
        avec la demande rédigée jointe.
      </p>
    </div>
  );
}
