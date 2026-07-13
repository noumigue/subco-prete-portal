'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionDecisions } from '@/lib/portal-types';
import { portalMediaUrl } from '@/lib/portal-media';
import { cloreSeanceAction, genererPvAction, joindrePvSigneAction, saveDecisionAction, setPresentsAction, uploadFileAction } from '@/app/(gestion)/actions';

const DEC_LBL: Record<string, string> = { retenu: 'Retenu', conditions: 'Retenu sous conditions', rejete: 'Rejeté', attente: "Liste d'attente" };
const RECO_LBL: Record<string, string> = { selection: 'Sélection', conditionnelle: 'Conditionnelle', attente: "Liste d'attente", rejet: 'Rejet' };
const DECISION_DE_RECO: Record<string, string> = { selection: 'retenu', conditionnelle: 'conditions', attente: 'attente', rejet: 'rejete' };

export function GestionDecisionsView({ decisions, appelId }: { decisions: GestionDecisions; appelId: string }) {
  const router = useRouter();
  const close = decisions.statut === 'close';
  const params = decisions.parametres!;
  const dossiers = decisions.dossiers || [];
  const quorumOk = (decisions.presents || 0) >= params.quorumSeuil;
  const allDecided = dossiers.every((d) => d.decisionComite);

  const [motifs, setMotifs] = useState<Record<string, string>>(() => Object.fromEntries(dossiers.map((d) => [d.candidatureId, d.motifAjustement || ''])));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true); setError(null);
    let r: { ok: boolean; error?: string };
    try {
      r = await fn();
    } catch {
      r = { ok: false, error: 'Connexion interrompue — rechargez la page et réessayez.' };
    }
    setPending(false);
    if (r.ok) router.refresh();
    else setError(r.error || 'Action refusée.');
  }
  const saveDecision = (candidatureId: string, decisionComite: string) => run(() => saveDecisionAction(appelId, { candidatureId, decisionComite, motifAjustement: motifs[candidatureId] || '' }));

  async function onPvSigne(file: File) {
    setPending(true); setError(null);
    const fd = new FormData(); fd.append('fichier', file);
    let up: { id: number; name: string } | null = null;
    try { up = await uploadFileAction(fd); } catch { up = null; }
    if (!up) { setPending(false); setError('Échec du téléversement — rechargez la page et réessayez.'); return; }
    let r: { ok: boolean; error?: string };
    try { r = await joindrePvSigneAction(appelId, up.id); } catch { r = { ok: false, error: 'Connexion interrompue — rechargez la page et réessayez.' }; }
    setPending(false);
    if (r.ok) router.refresh(); else setError(r.error || 'Échec.');
  }

  return (
    <>
      <h1 className="gx-page-title">Décisions du Comité — {decisions.appel?.codeCohorte} {close ? <span className="gx-statuschip gx-sc-val">Séance close</span> : null}</h1>
      <p className="gx-page-sub">Saisie par le secrétariat UGP des décisions prises en séance.</p>
      {error ? <div className="gx-flash err">{error}</div> : null}

      <div className="gx-quorum">
        Quorum :
        <input type="number" min={0} max={params.nbMembres} defaultValue={decisions.presents || 0} disabled={close || pending}
          onBlur={(e) => run(() => setPresentsAction(appelId, Number(e.target.value)))} />
        / {params.nbMembres} membres présents · seuil <b>{params.quorumSeuil}</b> (référentiel) →
        <span className={quorumOk ? 'ok' : 'ko'}>{quorumOk ? '✓ quorum atteint' : '✗ quorum non atteint'}</span>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Décisions par dossier</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="gx-constable">
            <thead><tr><th>Promoteur / projet</th><th style={{ textAlign: 'center' }}>Score</th><th>Reco</th><th>Décision du Comité</th></tr></thead>
            <tbody>
              {dossiers.map((d) => {
                const ecart = d.decisionComite && DECISION_DE_RECO[d.reco] !== d.decisionComite;
                return (
                  <RowGroup key={d.candidatureId}>
                    <tr>
                      <td><div style={{ fontWeight: 600 }}>{d.op}</div><div style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{d.proj}</div></td>
                      <td className="n">{d.totalFinal}</td>
                      <td style={{ fontSize: 12.5 }}>{RECO_LBL[d.reco]}</td>
                      <td>
                        <select value={d.decisionComite || ''} disabled={close || pending} onChange={(e) => saveDecision(d.candidatureId, e.target.value)}>
                          <option value="">— décision —</option>
                          {Object.keys(DEC_LBL).map((k) => <option key={k} value={k}>{DEC_LBL[k]}</option>)}
                        </select>
                      </td>
                    </tr>
                    {ecart && !close ? (
                      <tr><td colSpan={4}>
                        <div className="gx-adjust">
                          <span className="gx-adjust-lbl">⚠ Ajustement par rapport à la recommandation — motif obligatoire (6.4.3)</span>
                          <textarea rows={2} value={motifs[d.candidatureId] || ''} placeholder="Motivez l'écart…"
                            onChange={(e) => setMotifs((p) => ({ ...p, [d.candidatureId]: e.target.value }))}
                            onBlur={() => saveDecision(d.candidatureId, d.decisionComite!)} />
                        </div>
                      </td></tr>
                    ) : null}
                  </RowGroup>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gx-card">
        <div className="gx-block-title">Procès-verbal (Annexe 13)</div>
        <div className="gx-pvbox">
          <div className="gx-pvline">👥 <b>Participants</b> : préremplis (membres présents) + colonne signature</div>
          <div className="gx-pvline">📋 <b>Ordre du jour</b> : ouverture · rappel du processus · résultats · délibération · validation de la liste · recommandations</div>
          <div className="gx-pvline">🗂️ <b>Tableau des dossiers</b> : n° · promoteur · projet · score · décision (auto)</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending || !allDecided} onClick={() => run(() => genererPvAction(appelId, {}))}>⤓ Générer le PV (PDF)</button>
          {decisions.pvGenereUrl ? <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(decisions.pvGenereUrl) || '#'} target="_blank" rel="noopener">Voir le PV généré</a> : null}
          <label className="gx-btn gx-btn-ghost gx-btn-sm" style={{ cursor: 'pointer' }}>
            📎 Joindre le PV signé
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" style={{ display: 'none' }} disabled={pending} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPvSigne(f); }} />
          </label>
          {decisions.pvSigneUrl ? <span style={{ fontSize: 12.5, color: 'var(--emerald-dark)', fontWeight: 600 }}>✓ PV signé joint</span> : null}
        </div>
        {!allDecided ? <p style={{ fontSize: 12, color: 'var(--muted-warm)', margin: '8px 0 0' }}>Renseignez toutes les décisions pour générer le PV.</p> : null}
      </div>

      {!close ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="gx-btn gx-btn-primary" disabled={pending || !allDecided || !quorumOk} onClick={() => run(() => cloreSeanceAction(appelId))}>Clore la séance</button>
        </div>
      ) : null}

      <p className="gx-annot">
        <b>F3</b> quorum en paramètre référentiel (seuil éditable au CMS). <b>F4</b> PV Annexe 13 pré-généré → signé hors ligne → rechargé.
        Tout écart à la recommandation exige un <b>motif</b> (6.4.3). « Clore » fige les décisions et ouvre la publication.
      </p>
    </>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) { return <>{children}</>; }
