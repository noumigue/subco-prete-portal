'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionEvaluateurSlot, GestionEvaluationAssign as AssignData } from '@/lib/portal-types';
import { assignerEvaluateurAction } from '@/app/(gestion)/actions';

function FicheEtat({ slot }: { slot: GestionEvaluateurSlot }) {
  if (!slot?.evaluateurId) return <span className="gx-pill gx-pill-comp">Non assigné</span>;
  if (slot.ficheStatut === 'soumise') return <span className="gx-pill gx-pill-ok">✓ Fiche soumise</span>;
  return <span className="gx-pill gx-pill-val">À remplir</span>;
}

export function GestionEvaluationAssign({ data }: { data: AssignData }) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assign(rang: number, evaluateurId: number) {
    if (!evaluateurId) return;
    setPending(rang); setError(null);
    const r = await assignerEvaluateurAction({ documentId: data.documentId, evaluateurId, rang });
    setPending(null);
    if (r.ok) router.refresh();
    else setError(r.error || 'Assignation refusée.');
  }

  function Slot({ rang, slot }: { rang: number; slot: GestionEvaluateurSlot }) {
    const locked = slot?.ficheStatut === 'soumise';
    return (
      <div className="gx-card">
        <div className="gx-block-title">Évaluateur {rang}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            defaultValue={slot?.evaluateurId ?? ''}
            disabled={locked || pending === rang}
            onChange={(e) => assign(rang, Number(e.target.value))}
            style={{ maxWidth: 320 }}
          >
            <option value="">— Choisir un évaluateur —</option>
            {data.evaluateurs.map((ev) => <option key={ev.id} value={ev.id}>{ev.nom}</option>)}
          </select>
          <FicheEtat slot={slot} />
          {locked ? <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>Fiche signée — réassignation impossible.</span> : null}
        </div>
      </div>
    );
  }

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
      <h1 className="gx-page-title">Évaluation — {data.organisation?.nom} <span className="gx-num" style={{ fontSize: 13, color: 'var(--muted-warm)' }}>{data.numeroDossier}</span></h1>
      <p className="gx-page-sub">Assignation de la double notation (§6.3) — {data.organisation?.filiere}.</p>
      {error ? <div className="gx-flash err">{error}</div> : null}

      <Slot rang={1} slot={data.evaluateur1} />
      <Slot rang={2} slot={data.evaluateur2} />
      {data.evaluateur3?.evaluateurId ? <Slot rang={3} slot={data.evaluateur3} /> : null}

      {data.consolidationPrete ? (
        <div className="gx-card">
          <div className="gx-block-title">Consolidation</div>
          <p style={{ fontSize: 13.5, margin: '0 0 12px' }}>
            Les deux fiches sont soumises — l&apos;indépendance (E3) est levée.
            {data.consolidationStatut === 'figee' ? ' Consolidation figée.' : ' Prête à consolider.'}
          </p>
          <Link className="gx-btn gx-btn-primary gx-btn-sm" href={`/gestion/dossiers/${data.documentId}/consolidation`}>
            {data.consolidationStatut === 'figee' ? 'Consulter la consolidation' : 'Consolider les notes'}
          </Link>
        </div>
      ) : (
        <div className="gx-card">
          <div className="gx-block-title">Consolidation</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted-warm)', margin: 0 }}>En attente de la soumission des deux fiches (E3 : aucune visibilité croisée avant la double soumission).</p>
        </div>
      )}

      <p className="gx-annot">
        <b>E2 — assignation par l&apos;UGP.</b> Évaluateur 1 &amp; 2 parmi les experts (comptes internes). L&apos;évaluateur déclare l&apos;absence de conflit d&apos;intérêts
        (§5.8.1) à l&apos;ouverture de sa fiche ; une récusation revient ici pour réassignation. Le 3ᵉ évaluateur se désigne depuis la consolidation, en cas d&apos;écart.
      </p>
    </>
  );
}
