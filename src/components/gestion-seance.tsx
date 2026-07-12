'use client';

import { useState } from 'react';
import type { GestionSeance } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';

const RECO_LBL: Record<string, string> = { selection: 'Sélection', conditionnelle: 'Conditionnelle', attente: "Liste d'attente", rejet: 'Rejet' };
function bandClass(total: number) { return total >= 80 ? 'gx-band-a' : total >= 70 ? 'gx-band-b' : total >= 60 ? 'gx-band-c' : 'gx-band-d'; }

export function GestionSeanceView({ seance }: { seance: GestionSeance }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const dossiers = seance.dossiers || [];

  return (
    <>
      <h1 className="gx-page-title">Dossier de séance — Comité, {seance.appel?.codeCohorte || seance.appel?.nom}</h1>
      <p className="gx-page-sub">Documents et résultats consolidés soumis au Comité pour délibération.</p>

      <div className="gx-card">
        <div className="gx-block-title">Documents de séance</div>
        {seance.rapportPdfUrl ? (
          <a className="gx-doclink" href={portalMediaUrl(seance.rapportPdfUrl) || '#'} target="_blank" rel="noopener">
            <span className="gx-di">📄</span><span className="gx-dn">Rapport d&apos;évaluation</span><span className="gx-btn gx-btn-ghost gx-btn-sm">⤓</span>
          </a>
        ) : <p style={{ fontSize: 13, color: 'var(--muted-warm)', margin: 0 }}>Rapport en cours de préparation.</p>}
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Dossiers soumis à délibération</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="gx-constable">
            <thead><tr><th>#</th><th>Promoteur / projet</th><th style={{ textAlign: 'center' }}>Score</th><th>Bande</th><th>Reco</th><th></th></tr></thead>
            <tbody>
              {dossiers.map((d) => (
                <RowGroup key={d.rang} d={d} expanded={!!expanded[d.rang]} onToggle={() => setExpanded((p) => ({ ...p, [d.rang]: !p[d.rang] }))} />
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted-warm)', fontStyle: 'italic', marginTop: 6 }}>
          Cloisonnement (F2) : le Comité voit les scores consolidés, les forces/faiblesses et la recommandation — jamais les notes nominatives de chaque évaluateur.
        </p>
      </div>

      <p className="gx-annot"><b>Rôle Comité = lecture.</b> La saisie des décisions et du PV est faite par le secrétariat UGP (B3). Le Comité délibère en séance sur cette base.</p>
    </>
  );
}

function RowGroup({ d, expanded, onToggle }: { d: NonNullable<GestionSeance['dossiers']>[number]; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr>
        <td><span className="gx-rank">{d.rang}</span></td>
        <td><div style={{ fontWeight: 600 }}>{d.op}</div><div style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{d.proj}</div></td>
        <td className="n" style={{ fontSize: 15 }}>{d.totalFinal}</td>
        <td><span className={`gx-band ${bandClass(d.totalFinal - d.bonus)}`}>{d.bande}</span></td>
        <td><b>{RECO_LBL[d.reco] || d.reco}</b></td>
        <td><button type="button" className="gx-back" style={{ margin: 0, fontSize: 12 }} onClick={onToggle}>{expanded ? '▾' : '▸'}</button></td>
      </tr>
      {expanded ? (
        <tr><td colSpan={6}>
          <div className="gx-recap" style={{ margin: '4px 0 8px' }}>
            <div className="gx-inline2">
              <div><b>Forces</b><ul style={{ margin: '4px 0', paddingLeft: 18, color: 'var(--muted-warm)' }}>{d.forces.length ? d.forces.map((f, i) => <li key={i}>{f}</li>) : <li style={{ listStyle: 'none' }}>—</li>}</ul></div>
              <div><b>Faiblesses</b><ul style={{ margin: '4px 0', paddingLeft: 18, color: 'var(--muted-warm)' }}>{d.faiblesses.length ? d.faiblesses.map((f, i) => <li key={i}>{f}</li>) : <li style={{ listStyle: 'none' }}>—</li>}</ul></div>
            </div>
            {d.conditions.length ? <div style={{ marginTop: 6, fontSize: 13 }}><b style={{ color: 'var(--gx-amber-tx)' }}>Conditions proposées :</b> {d.conditions.map((c) => c.texte).join(' · ')}</div> : null}
          </div>
        </td></tr>
      ) : null}
    </>
  );
}
