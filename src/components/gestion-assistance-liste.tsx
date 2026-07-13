'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GestionAssistanceRow, GestionAssistanceStatut } from '@/lib/portal-types';

type FiltreStatut = 'toutes' | GestionAssistanceStatut;

const FILTRES: [FiltreStatut, string][] = [
  ['toutes', 'Toutes'],
  ['ouverte', 'Ouvertes'],
  ['en_cours', 'En cours'],
  ['resolue', 'Résolues'],
];

function fmtDate(v: string | null) {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function StatutPill({ statut }: { statut: GestionAssistanceStatut }) {
  if (statut === 'resolue') return <span className="gx-pill gx-pill-ok">✓ Résolue</span>;
  if (statut === 'en_cours') return <span className="gx-pill gx-pill-comp">⏳ En cours</span>;
  return <span className="gx-pill gx-pill-val">● Ouverte</span>;
}

export function GestionAssistanceListe({
  rows,
  categories,
  userId,
}: {
  rows: GestionAssistanceRow[];
  categories: { code: string; libelle: string }[];
  userId: number;
}) {
  const [fStatut, setFStatut] = useState<FiltreStatut>('toutes');
  const [fCat, setFCat] = useState('');
  const [fMine, setFMine] = useState(false);

  const count = (s: FiltreStatut) => (s === 'toutes' ? rows.length : rows.filter((r) => r.statut === s).length);

  let items = rows;
  if (fStatut !== 'toutes') items = items.filter((r) => r.statut === fStatut);
  if (fCat) items = items.filter((r) => r.categorie?.code === fCat);
  if (fMine) items = items.filter((r) => r.priseEnChargePar?.id === userId);

  return (
    <div className="gx">
      <h1 className="gx-page-title">
        Assistance
        <Link className="gx-btn gx-btn-primary gx-btn-sm" style={{ marginLeft: 'auto' }} href="/gestion/assistance/nouvelle">
          + Demande au nom d&apos;un opérateur
        </Link>
      </h1>
      <p className="gx-page-sub">Demandes d&apos;assistance des opérateurs — traitement par l&apos;équipe du projet.</p>

      <div className="gx-filters" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="gx-tabs" style={{ marginBottom: 0 }}>
          {FILTRES.map(([k, l]) => (
            <button key={k} type="button" className={`gx-tab${fStatut === k ? ' on' : ''}`} onClick={() => setFStatut(k)}>
              {l} <span className="gx-n">{count(k)}</span>
            </button>
          ))}
        </div>
        <select value={fCat} onChange={(e) => setFCat(e.target.value)} style={{ width: 'auto' }} aria-label="Filtrer par catégorie">
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.code} value={c.code}>{c.libelle}</option>
          ))}
        </select>
        <label className="gx-chk" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={fMine} onChange={(e) => setFMine(e.target.checked)} style={{ width: 'auto' }} />
          Ma prise en charge
        </label>
      </div>

      {items.length === 0 ? (
        <div className="gx-empty">Aucune demande à ces filtres.</div>
      ) : (
        items.map((d) => (
          <Link className="gx-srow" key={d.documentId} href={`/gestion/assistance/${d.documentId}`}>
            <div className="gx-srow-main">
              <div className="gx-srow-who">{d.objet}</div>
              <div className="gx-srow-meta">
                <StatutPill statut={d.statut} />
                <b style={{ color: 'var(--ink, inherit)' }}>{d.operateur}</b>
                {d.categorie?.libelle ? <span>{d.categorie.libelle}</span> : null}
                {d.concerneCandidature ? (
                  <span className="gx-srow-num" style={{ fontSize: 12 }}>{d.concerneCandidature.numeroDossier || 'Dossier'}</span>
                ) : d.concerneSubvention ? (
                  <span className="gx-srow-num" style={{ fontSize: 12 }}>{d.concerneSubvention.numeroConvention || 'Subvention'}</span>
                ) : (
                  <span>Question générale</span>
                )}
                {d.origine === 'ugp' ? <span className="gx-tag-origin">ouverte par l&apos;équipe</span> : null}
                {d.priseEnChargePar ? <span>· {d.priseEnChargePar.nom}</span> : null}
                {d.dernierLe ? (
                  <span>· {d.dernierAuteur === 'equipe' ? 'Équipe' : 'Opérateur'} · {fmtDate(d.dernierLe)}</span>
                ) : null}
              </div>
            </div>
            <span className="gx-btn gx-btn-ghost gx-btn-sm">Ouvrir</span>
          </Link>
        ))
      )}

      <p className="gx-annot">
        <b>H1</b> prise en charge nominative (réassignable, sans blocage). <b>H2</b> accès UGP + Cabinet.
        <b> H3</b> filtre par catégorie, pas de routage automatique. <b>H4</b> « + Demande au nom d&apos;un opérateur »
        pour les sollicitations téléphoniques. Miroir exact du module Assistance opérateur — même canal, vu de l&apos;autre bout.
      </p>
    </div>
  );
}
