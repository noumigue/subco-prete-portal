'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionConsolidation as ConsData, GestionConsolidationRow } from '@/lib/portal-types';
import { figerConsolidationAction, harmoniserAction, troisiemeEvaluateurAction } from '@/app/(gestion)/actions';

function bandClass(total: number) {
  if (total >= 80) return 'gx-band-a';
  if (total >= 70) return 'gx-band-b';
  if (total >= 60) return 'gx-band-c';
  return 'gx-band-d';
}

export function GestionConsolidation({ data }: { data: ConsData }) {
  const router = useRouter();
  const figee = data.statut === 'figee';
  const ecarts = data.ecartsNonTraites || [];
  const totals = data.totals!;
  const aTroisieme = !!data.aTroisieme;

  const [harmonVals, setHarmonVals] = useState<Record<string, string>>({});
  const [troisieme, setTroisieme] = useState<number | ''>('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true); setError(null);
    const r = await fn();
    setPending(false);
    if (r.ok) router.refresh();
    else setError(r.error || 'Action refusée.');
  }

  const colCount = 3 + (aTroisieme ? 1 : 0) + 1; // Critère + N1 + N2 (+N3) + Moyenne + flag → handled inline

  function Row({ r }: { r: GestionConsolidationRow }) {
    return (
      <tr className={r.gap && !r.traite ? 'gap' : ''}>
        <td className="gx-cregle">{r.code}. {r.libelle}</td>
        <td className="n">{r.n1 ?? '—'}</td>
        <td className="n">{r.n2 ?? '—'}</td>
        {aTroisieme ? <td className="n">{r.n3 ?? '—'}</td> : null}
        <td className="n">{r.retenue.toFixed(1)}{r.harmonisee ? ' *' : ''}</td>
        <td>{r.gap ? (r.traite ? <span className="gx-pill gx-pill-ok" style={{ fontSize: 10 }}>traité</span> : <span className="gx-gapflag">écart {r.ecart} ≥ {r.seuil.toFixed(0)}</span>) : ''}</td>
      </tr>
    );
  }

  return (
    <>
      <Link className="gx-back" href={`/gestion/dossiers/${data.documentId}/evaluation`}>← Évaluation</Link>
      <h1 className="gx-page-title">Consolidation — {data.organisation?.nom} <span className="gx-num" style={{ fontSize: 13, color: 'var(--muted-warm)' }}>{data.numeroDossier}</span></h1>
      <p className="gx-page-sub">Notes des deux évaluateurs (soumises), moyenne par critère, écarts signalés (E4).</p>
      {error ? <div className="gx-flash err">{error}</div> : null}
      {figee ? <div className="gx-flash">✓ Consolidation figée — versée au rapport d&apos;évaluation (temps 2). Lecture seule.</div> : null}

      {!figee && ecarts.length ? (
        <div className="gx-es ko">
          <div className="gx-esh">⚠ {ecarts.length} écart(s) ≥ 20 % à traiter</div>
          <div style={{ fontSize: 13, color: 'var(--gx-red-tx)', marginBottom: 10 }}>Sur les critères en écart, harmonisez la note retenue après discussion technique, ou sollicitez un 3ᵉ évaluateur (6.3.2).</div>
          {ecarts.map((e) => (
            <div key={e.code} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '5px 0' }}>
              <b style={{ minWidth: 42 }}>{e.code}</b>
              <span style={{ flex: 1, minWidth: 160, fontSize: 13 }}>{e.libelle}</span>
              <input type="number" min={0} step={1} placeholder="note retenue" style={{ width: 120 }} value={harmonVals[e.code] ?? ''} onChange={(ev) => setHarmonVals((p) => ({ ...p, [e.code]: ev.target.value }))} />
              <button type="button" className="gx-btn gx-btn-primary gx-btn-sm" disabled={pending || harmonVals[e.code] === undefined || harmonVals[e.code] === ''} onClick={() => run(() => harmoniserAction({ documentId: data.documentId!, critereCode: e.code, noteRetenue: Number(harmonVals[e.code]) }))}>Retenir</button>
            </div>
          ))}
          {!aTroisieme ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12, borderTop: '1px solid var(--gx-red-bd)', paddingTop: 12 }}>
              <span style={{ fontSize: 13 }}>ou 3ᵉ évaluateur :</span>
              <select value={troisieme} onChange={(e) => setTroisieme(e.target.value ? Number(e.target.value) : '')} style={{ maxWidth: 240 }}>
                <option value="">— choisir —</option>
                {(data.evaluateurs || []).map((ev) => <option key={ev.id} value={ev.id}>{ev.nom}</option>)}
              </select>
              <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending || troisieme === ''} onClick={() => run(() => troisiemeEvaluateurAction({ documentId: data.documentId!, evaluateurId: Number(troisieme) }))}>Solliciter un 3ᵉ évaluateur</button>
            </div>
          ) : null}
        </div>
      ) : !figee ? (
        <div className="gx-es"><div className="gx-esh" style={{ color: 'var(--emerald-dark)' }}>✓ Aucun écart ≥ 20 % en attente</div><div style={{ fontSize: 12.5, color: 'var(--muted-warm)' }}>Consolidation prête à être figée.</div></div>
      ) : null}

      <div className="gx-card">
        <div className="gx-block-title">Notes consolidées</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="gx-constable">
            <thead>
              <tr>
                <th>Critère</th>
                <th style={{ textAlign: 'center' }}>{data.evaluateur1Nom}</th>
                <th style={{ textAlign: 'center' }}>{data.evaluateur2Nom}</th>
                {aTroisieme ? <th style={{ textAlign: 'center' }}>Éval. 3</th> : null}
                <th style={{ textAlign: 'center' }}>Retenue</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={colCount + 1} style={{ background: '#fbfaf4', fontWeight: 700, color: 'var(--pine)' }}>Bloc A — Infrastructure</td></tr>
              {(data.rows?.blocA || []).map((r) => <Row key={r.code} r={r} />)}
              <tr><td colSpan={colCount + 1} style={{ background: '#fbfaf4', fontWeight: 700, color: 'var(--pine)' }}>Bloc B — Candidat</td></tr>
              {(data.rows?.blocB || []).map((r) => <Row key={r.code} r={r} />)}
              <tr><td colSpan={colCount + 1} style={{ background: '#fbfaf4', fontWeight: 700, color: 'var(--pine)' }}>Bonus d&apos;inclusion</td></tr>
              {(data.bonusRows || []).map((r) => <Row key={r.code} r={r} />)}
            </tbody>
            <tfoot>
              <tr>
                <td>Total hors bonus</td>
                <td className="n" colSpan={aTroisieme ? 3 : 2}></td>
                <td className="n">{totals.totalHorsBonus.toFixed(1)}</td>
                <td><span className={`gx-band ${bandClass(totals.totalHorsBonus)}`}>{totals.bande}</span></td>
              </tr>
              <tr>
                <td>Total final (bonus inclus)</td>
                <td className="n" colSpan={aTroisieme ? 3 : 2}>+ {totals.bonus} bonus</td>
                <td className="n">{totals.totalFinal.toFixed(1)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '10px 0 0' }}>* note harmonisée. Départage ex æquo (6.5.1) appliqué au classement : Bloc A → impact socio-éco → cofinancement → inclusion.</p>
        {!figee ? (
          <div style={{ marginTop: 14 }}>
            <button type="button" className="gx-btn gx-btn-primary" disabled={pending || ecarts.length > 0} onClick={() => run(() => figerConsolidationAction(data.documentId!))}>
              {ecarts.length ? 'Traitez les écarts pour figer' : (pending ? 'Figeage…' : 'Figer la consolidation')}
            </button>
          </div>
        ) : null}
      </div>

      <p className="gx-annot">
        <b>E4 — écart ≥ 20 % du barème du critère</b> (base en référentiel, {(data.ecartPct ?? 0.2) * 100} %). Deux voies : harmonisation (révision journalisée + re-signature)
        ou 3ᵉ évaluateur (moyenne recalculée sur les notes retenues). <b>E5</b> : le Cabinet consolide, l&apos;UGP fige → versé au rapport / Comité (temps 2). Chaque acte est journalisé.
      </p>
    </>
  );
}
