'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionRapport, GestionRapportDossier } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import { renvoyerRapportAction, saveRapportDossierAction, soumettreRapportAction, validerRapportAction } from '@/app/(gestion)/actions';

const RECO_LBL: Record<string, string> = { selection: 'Sélection', conditionnelle: 'Conditionnelle', attente: "Liste d'attente", rejet: 'Rejet' };
const STATUT_LBL: Record<string, string> = { brouillon: 'Brouillon', soumis: "Soumis à l'UGP", valide: 'Validé' };
function bandClass(total: number) { return total >= 80 ? 'gx-band-a' : total >= 70 ? 'gx-band-b' : total >= 60 ? 'gx-band-c' : 'gx-band-d'; }

export function GestionRapportView({ rapport, appelId, role }: { rapport: GestionRapport; appelId: string; role: 'instructeur' | 'ugp' }) {
  const router = useRouter();
  const editable = rapport.statut === 'brouillon';
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renvoiOpen, setRenvoiOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, refresh = true) {
    setPending(true); setError(null);
    const r = await fn();
    setPending(false);
    if (r.ok) { if (refresh) router.refresh(); }
    else setError(r.error || 'Action refusée.');
  }
  const setReco = (d: GestionRapportDossier, reco: string) => run(() => saveRapportDossierAction(appelId, { candidatureId: d.candidatureId, reco }));
  const setConditions = (d: GestionRapportDossier, text: string) => {
    const conditions = text.split('\n').map((l) => l.trim()).filter(Boolean).map((texte) => ({ texte, type: 'autre' }));
    return run(() => saveRapportDossierAction(appelId, { candidatureId: d.candidatureId, conditions }), false);
  };

  return (
    <>
      <h1 className="gx-page-title">
        Rapport d&apos;évaluation — {rapport.appel.codeCohorte || rapport.appel.nom}
        <span className={`gx-statuschip ${rapport.statut === 'valide' ? 'gx-sc-val' : 'gx-sc-draft'}`}>{STATUT_LBL[rapport.statut]}</span>
      </h1>
      <p className="gx-page-sub">Consolidations figées, classées par score total (bonus inclus). Ex æquo départagé par le Bloc A (6.5.1) ; priorité stratégique = ajustement humain motivé.</p>
      {error ? <div className="gx-flash err">{error}</div> : null}
      {rapport.statut === 'soumis' && role === 'instructeur' ? <div className="gx-validation-banner">⏳ Rapport soumis — en attente de validation par l&apos;UGP.</div> : null}
      {rapport.commentaireRenvoi ? <div className="gx-validation-banner">↩︎ <b>Renvoyé par l&apos;UGP :</b> {rapport.commentaireRenvoi}</div> : null}

      <div className="gx-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="gx-constable">
            <thead><tr><th>#</th><th>Dossier</th><th style={{ textAlign: 'center' }}>A</th><th style={{ textAlign: 'center' }}>B</th><th style={{ textAlign: 'center' }}>Bon.</th><th style={{ textAlign: 'center' }}>Total</th><th>Bande</th><th>Reco</th><th></th></tr></thead>
            <tbody>
              {rapport.dossiers.map((d) => (
                <RowGroup key={d.candidatureId} d={d} editable={editable} expanded={!!expanded[d.candidatureId]}
                  onToggle={() => setExpanded((p) => ({ ...p, [d.candidatureId]: !p[d.candidatureId] }))}
                  onReco={(v) => setReco(d, v)} onConditions={(t) => setConditions(d, t)} pending={pending} />
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '10px 0 0' }}>La recommandation est pré-remplie depuis la bande ; le Cabinet peut l&apos;ajuster. * score incluant une note harmonisée.</p>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {rapport.statut === 'brouillon' ? (
            <button type="button" className="gx-btn gx-btn-primary" disabled={pending} onClick={() => run(() => soumettreRapportAction(appelId))}>Soumettre à l&apos;UGP</button>
          ) : null}
          {rapport.statut === 'soumis' && role === 'ugp' ? (
            <>
              <button type="button" className="gx-btn gx-btn-primary" disabled={pending} onClick={() => run(() => validerRapportAction(appelId))}>Valider le rapport</button>
              <button type="button" className="gx-btn gx-btn-ghost" disabled={pending} onClick={() => setRenvoiOpen((v) => !v)}>Renvoyer au Cabinet</button>
            </>
          ) : null}
          {rapport.statut === 'valide' && rapport.pdfUrl ? (
            <a className="gx-btn gx-btn-ghost" href={portalMediaUrl(rapport.pdfUrl) || '#'} target="_blank" rel="noopener">⤓ Rapport d&apos;évaluation (PDF)</a>
          ) : null}
        </div>
        {renvoiOpen ? (
          <div className="gx-subform" style={{ marginLeft: 0 }}>
            <label>Commentaire de renvoi</label>
            <textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ce qui doit être revu…" />
            <div style={{ marginTop: 8 }}><button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => run(() => renvoyerRapportAction(appelId, commentaire))}>Confirmer le renvoi</button></div>
          </div>
        ) : null}
      </div>

      <p className="gx-annot">
        <b>F1</b> rapport exportable en PDF (archivage 6.6). <b>Circuit §4.2</b> : le Cabinet prépare → l&apos;UGP valide → transmission au Comité.
        Le classement (6.4.2) et l&apos;ex æquo (6.5.1) sont automatiques ; les conditions d&apos;une reco « conditionnelle » alimenteront les conditions préalables de « Ma subvention ».
      </p>
    </>
  );
}

function RowGroup({ d, editable, expanded, onToggle, onReco, onConditions, pending }: {
  d: GestionRapportDossier; editable: boolean; expanded: boolean; onToggle: () => void; onReco: (v: string) => void; onConditions: (t: string) => void; pending: boolean;
}) {
  return (
    <>
      <tr>
        <td><span className="gx-rank">{d.rang}</span></td>
        <td><div className="gx-num">{d.num}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.op}</div><div style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{d.proj}</div></td>
        <td className="n">{d.totalA}</td><td className="n">{d.totalB}</td><td className="n">+{d.bonus}</td>
        <td className="n" style={{ fontSize: 15 }}>{d.totalFinal}{d.hasHarmon ? <span title="écart harmonisé" style={{ color: 'var(--gold)' }}> *</span> : null}</td>
        <td><span className={`gx-band ${bandClass(d.totalHorsBonus)}`}>{d.bande}</span></td>
        <td>{editable ? (
          <select value={d.reco} disabled={pending} onChange={(e) => onReco(e.target.value)} style={{ padding: '5px 8px', fontSize: 12.5 }}>
            {Object.keys(RECO_LBL).map((k) => <option key={k} value={k}>{RECO_LBL[k]}</option>)}
          </select>
        ) : <b>{RECO_LBL[d.reco]}</b>}</td>
        <td><button type="button" className="gx-back" style={{ margin: 0, fontSize: 12 }} onClick={onToggle}>{expanded ? '▾' : '▸'} détail</button></td>
      </tr>
      {expanded ? (
        <tr><td colSpan={9}>
          <div className="gx-recap" style={{ margin: '4px 0 8px' }}>
            <div className="gx-inline2">
              <div><b>Forces</b><ul style={{ margin: '4px 0', paddingLeft: 18, color: 'var(--muted-warm)' }}>{d.forces.length ? d.forces.map((f, i) => <li key={i}>{f}</li>) : <li style={{ listStyle: 'none' }}>—</li>}</ul></div>
              <div><b>Faiblesses</b><ul style={{ margin: '4px 0', paddingLeft: 18, color: 'var(--muted-warm)' }}>{d.faiblesses.length ? d.faiblesses.map((f, i) => <li key={i}>{f}</li>) : <li style={{ listStyle: 'none' }}>—</li>}</ul></div>
            </div>
            {d.reco === 'conditionnelle' ? (
              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gx-amber-tx)' }}>Conditions à lever avant signature (→ conditions préalables de « Ma subvention »)</label>
                {editable ? (
                  <textarea rows={2} defaultValue={d.conditions.map((c) => c.texte).join('\n')} placeholder="Une condition par ligne…" onBlur={(e) => onConditions(e.target.value)} style={{ background: '#fffdf6' }} />
                ) : <div style={{ marginTop: 4 }}>{d.conditions.map((c) => c.texte).join(' · ') || '—'}</div>}
              </div>
            ) : null}
          </div>
        </td></tr>
      ) : null}
    </>
  );
}
