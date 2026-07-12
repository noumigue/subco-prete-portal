'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GestionPublication } from '@/lib/portal-types';
import { publierDecisionsAction, setNonObjectionAction, uploadFileAction } from '@/app/(gestion)/actions';

const DEC_LBL: Record<string, string> = { retenu: 'Retenu', conditions: 'Retenu sous conditions', rejete: 'Rejeté', attente: "Liste d'attente" };

function effet(dec: string | null) {
  if (dec === 'retenu' || dec === 'conditions') return <span className="gx-eff-sel">Sélectionné → subvention en préparation{dec === 'conditions' ? ' (+ conditions)' : ''}</span>;
  if (dec === 'rejete') return <span className="gx-eff-rej">Non retenu → notification de décision signée</span>;
  return <span className="gx-eff-att">Liste d&apos;attente → reste « en instruction » côté candidat</span>;
}

export function GestionPublicationView({ publication, appelId }: { publication: GestionPublication; appelId: string }) {
  const router = useRouter();
  const nobj = publication.nonObjection;
  const bloque = nobj.requise && nobj.statut !== 'accordee';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true); setError(null);
    const r = await fn();
    setPending(false);
    if (r.ok) router.refresh(); else setError(r.error || 'Action refusée.');
  }
  async function onAccord(file: File) {
    setPending(true); setError(null);
    const fd = new FormData(); fd.append('fichier', file);
    const up = await uploadFileAction(fd);
    if (!up) { setPending(false); setError('Échec du téléversement.'); return; }
    const r = await setNonObjectionAction(appelId, { action: 'accordee', documentFileId: up.id });
    setPending(false);
    if (r.ok) router.refresh(); else setError(r.error || 'Échec.');
  }

  return (
    <>
      <h1 className="gx-page-title">Publication des décisions — {publication.appel.codeCohorte} {publication.publiee ? <span className="gx-statuschip gx-sc-val">Publiée</span> : null}</h1>
      <p className="gx-page-sub">Publication par vague (F5) : un seul acte pour toute la liste de la cohorte.</p>
      {error ? <div className="gx-flash err">{error}</div> : null}

      <label className="gx-flagline">
        <input type="checkbox" checked={nobj.requise} disabled={publication.publiee || pending} onChange={(e) => run(() => setNonObjectionAction(appelId, { requise: e.target.checked }))} />
        <span><b>Cette cohorte est soumise à non-objection de la Banque mondiale (§6.7)</b> — cas de la phase pilote et des premiers projets. Si coché, les notifications restent <b>bloquées</b> jusqu&apos;à l&apos;accord écrit.</span>
      </label>

      {nobj.requise ? (
        <div className="gx-nobj">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <b>Non-objection Banque mondiale</b>
            <span className="gx-nobj-st">{nobj.statut === 'a_demander' ? 'À demander' : nobj.statut === 'transmise' ? 'Demande transmise' : '✓ Accord reçu'}</span>
          </div>
          <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--muted-warm)' }}>
            <li>Pièces prêtes (Annexe 14) : rapport d&apos;évaluation · PV du Comité · liste des projets recommandés · tableau des scores · synthèse d&apos;éligibilité · note E&S</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {nobj.statut === 'a_demander' ? <button type="button" className="gx-btn gx-btn-ghost gx-btn-sm" disabled={pending} onClick={() => run(() => setNonObjectionAction(appelId, { action: 'transmise' }))}>Marquer « demande transmise »</button> : null}
            {nobj.statut !== 'accordee' ? (
              <label className="gx-btn gx-btn-primary gx-btn-sm" style={{ cursor: 'pointer' }}>
                Enregistrer l&apos;accord reçu (document)
                <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} disabled={pending} onChange={(e) => { const f = e.target.files?.[0]; if (f) onAccord(f); }} />
              </label>
            ) : <span style={{ fontSize: 12.5, color: 'var(--emerald-dark)', fontWeight: 600 }}>Accord enregistré{nobj.dateAccord ? ` le ${new Date(nobj.dateAccord).toLocaleDateString('fr-FR')}` : ''} · document joint</span>}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted-warm)', margin: '8px 0 0' }}>Transmission via canaux officiels hors plateforme ; l&apos;outillage complet de la demande (Annexe 14) = phase 5.</p>
        </div>
      ) : null}

      <div className={`gx-card${bloque ? ' gx-blocked' : ''}`}>
        <div className="gx-block-title">Aperçu des effets à la publication</div>
        {publication.dossiers.map((d, i) => (
          <div className="gx-effrow" key={i}>
            <span className="gx-to"><b>{d.op}</b> · {DEC_LBL[d.decisionComite || ''] || '—'}</span>
            <span className="gx-arrow">→</span>{effet(d.decisionComite)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="gx-btn gx-btn-primary" disabled={bloque || publication.publiee || pending} onClick={() => { if (confirm('Publier les décisions de la cohorte et notifier les opérateurs (e-mail + SMS) ?')) run(() => publierDecisionsAction(appelId)); }}>
          Publier les décisions &amp; notifier
        </button>
        {bloque ? <span style={{ fontSize: 13, color: 'var(--gx-amber-tx)', fontWeight: 600 }}>🔒 Publication bloquée : non-objection en attente</span> : null}
        {publication.publiee ? <span style={{ fontSize: 13, color: 'var(--emerald-dark)', fontWeight: 600 }}>✓ Décisions publiées — notifications envoyées</span> : null}
      </div>

      <p className="gx-annot">
        <b>E7 — pont non-objection.</b> Le flag §6.7 bloque les notifications jusqu&apos;à l&apos;enregistrement de l&apos;accord. <b>E6 — traduction candidat</b> :
        Retenu/sous conditions → « Sélectionné » (+ subvention en préparation, conditions → conditions préalables) ; Rejeté → « Non retenu » + notification signée ;
        Liste d&apos;attente → reste « en instruction ». <b>F5</b> : publication par vague.
      </p>
    </>
  );
}
