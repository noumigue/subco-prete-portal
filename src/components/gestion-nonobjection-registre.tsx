'use client';

import Link from 'next/link';
import type { GestionNoRow, GestionNoStatut } from '@/lib/portal-types';

export function NoStatutPill({ statut }: { statut: GestionNoStatut }) {
  if (statut === 'accordee') return <span className="gx-pill gx-pill-acc">✓ Accordée</span>;
  if (statut === 'transmise') return <span className="gx-pill gx-pill-trans">⏳ Transmise — en attente BM</span>;
  if (statut === 'observations') return <span className="gx-pill gx-pill-obs">✎ Observations reçues</span>;
  return <span className="gx-pill gx-pill-prep">En préparation</span>;
}

function fmtDate(v: string | null) {
  if (!v) return '';
  const d = v.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : v;
}

export function GestionNonObjectionRegistre({ rows, canWrite }: { rows: GestionNoRow[]; canWrite: boolean }) {
  return (
    <div className="gx">
      <h1 className="gx-page-title">
        Non-objection
        {canWrite ? (
          <Link className="gx-btn gx-btn-primary gx-btn-sm" style={{ marginLeft: 'auto' }} href="/gestion/non-objection/nouvelle">
            + Nouvelle demande
          </Link>
        ) : null}
      </h1>
      <p className="gx-page-sub">Registre des demandes de non-objection à la Banque mondiale (§6.7).</p>

      {rows.length === 0 ? (
        <div className="gx-empty">Aucune demande de non-objection.</div>
      ) : (
        rows.map((n) => (
          <Link className="gx-nrow" key={n.documentId} href={`/gestion/non-objection/${n.documentId}`}>
            <div className="gx-nrow-main">
              <div className="gx-nrow-obj">{n.objet}</div>
              <div className="gx-nrow-meta">
                <span>Cas {n.type?.code || '—'}) {n.type?.libelle || ''}</span>
                {n.reference && n.reference !== '—' ? <span>· {n.reference}</span> : null}
                <span className="gx-vtag">v{n.version}</span>
                {n.dateTransmission ? <span>· transmise {fmtDate(n.dateTransmission)}</span> : null}
                {n.dateAccord ? <span>· accord {fmtDate(n.dateAccord)}</span> : null}
              </div>
            </div>
            <NoStatutPill statut={n.statut} />
            <span className="gx-btn gx-btn-ghost gx-btn-sm">Ouvrir</span>
          </Link>
        ))
      )}

      <p className="gx-annot">
        <b>I1 — registre générique</b> : les 9 cas 6.7.1 (a–i) vivent en référentiel éditable (liste « adaptable »).
        Seul le cas <b>sélection</b> est outillé (génération Annexe 14) — les autres suivent le même circuit avec demande
        rédigée jointe. Rien ne s&apos;exécute avant l&apos;accord écrit ; « accordée » reste l&apos;unique déblocage de la publication (contrat 2b).
      </p>
    </div>
  );
}
