'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GestionSubventionRow, GestionSubventionStatut } from '@/lib/portal-types';

const TABS: [GestionSubventionStatut, string][] = [
  ['preparation', 'En préparation'],
  ['active', 'Actives'],
  ['suspendue', 'Suspendues'],
  ['cloturee', 'Closes'],
];

function fmtMontant(v: string | null) {
  if (!v) return '—';
  try {
    return Number(BigInt(v)).toLocaleString('fr-FR');
  } catch {
    return v;
  }
}

function StatutChip({ statut }: { statut: GestionSubventionStatut }) {
  if (statut === 'preparation') return <span className="gx-statuschip gx-sc-prep">Préparation</span>;
  if (statut === 'active') return <span className="gx-statuschip gx-sc-active">Active</span>;
  if (statut === 'suspendue') return <span className="gx-statuschip gx-sc-susp">Suspendue</span>;
  return <span className="gx-statuschip">Close</span>;
}

export function GestionSubventionsListe({ rows }: { rows: GestionSubventionRow[] }) {
  const counts: Record<GestionSubventionStatut, number> = { preparation: 0, active: 0, suspendue: 0, cloturee: 0 };
  rows.forEach((r) => { if (counts[r.statut] !== undefined) counts[r.statut]++; });

  // Onglet initial : premier onglet non vide (Actives par défaut si présentes).
  const initial: GestionSubventionStatut = counts.active > 0 ? 'active' : (TABS.find(([k]) => counts[k] > 0)?.[0] || 'preparation');
  const [tab, setTab] = useState<GestionSubventionStatut>(initial);
  const items = rows.filter((r) => r.statut === tab);

  return (
    <div className="gx">
      <h1 className="gx-page-title">Subventions</h1>
      <p className="gx-page-sub">Actes de gestion des projets sélectionnés — préparation, convention, décaissements, suivi.</p>

      <div className="gx-tabs">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" className={`gx-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
            {l} <span className="gx-n">{counts[k]}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="gx-empty">Aucune subvention à ce statut.</div>
      ) : (
        items.map((s) => (
          <Link className="gx-srow" key={s.documentId} href={`/gestion/subventions/${s.documentId}`}>
            <div className="gx-srow-main">
              <div className="gx-srow-num">{s.numeroConvention || '— convention en préparation'}</div>
              <div className="gx-srow-who">{s.op}</div>
              <div className="gx-srow-meta">
                <span>{s.proj}</span>
                <span>{fmtMontant(s.montantSubvention)} $ de subvention</span>
              </div>
            </div>
            <StatutChip statut={s.statut} />
            <span className="gx-btn gx-btn-ghost gx-btn-sm">Ouvrir</span>
          </Link>
        ))
      )}

      <p className="gx-annot">
        <b>Miroir de « Ma subvention ».</b> Chaque acte posé ici écrit l&apos;état que le bénéficiaire lit côté portail :
        validation de condition, avis de décaissement, jalon, mesure corrective, signature. Les fonds ne transitent jamais
        par le bénéficiaire (§8.14 : paiement direct UGP→fournisseur).
      </p>
    </div>
  );
}
