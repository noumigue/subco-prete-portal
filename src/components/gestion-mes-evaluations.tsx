'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { GestionMesEvaluationRow, GestionMesEvaluationsMeta } from '@/lib/portal-types';

type Filtre = 'toutes' | 'a_remplir' | 'soumises' | 'retires';

/**
 * « Mes évaluations ». La liste n'est plus tronquée (elle l'était à 100, ce qui masquait en
 * silence les dossiers au-delà) et arrive triée par numéro : avec plus de cent lignes, l'ordre
 * d'assignation est illisible. Le filtre évite de parcourir toute la liste pour retrouver ce
 * qu'il reste à faire.
 */
export function GestionMesEvaluations({
  rows,
  meta,
}: {
  rows: GestionMesEvaluationRow[];
  meta: GestionMesEvaluationsMeta | null;
}) {
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [recherche, setRecherche] = useState('');

  const n = {
    toutes: meta?.total ?? rows.length,
    a_remplir: meta?.aRemplir ?? rows.filter((d) => !d.retire && d.ficheStatut !== 'soumise').length,
    soumises: meta?.soumises ?? rows.filter((d) => d.ficheStatut === 'soumise').length,
    retires: meta?.retires ?? rows.filter((d) => d.retire).length,
  };

  const q = recherche.trim().toLowerCase();
  let items = rows;
  if (filtre === 'a_remplir') items = items.filter((d) => !d.retire && d.ficheStatut !== 'soumise');
  if (filtre === 'soumises') items = items.filter((d) => d.ficheStatut === 'soumise');
  if (filtre === 'retires') items = items.filter((d) => d.retire);
  if (q) {
    items = items.filter(
      (d) => (d.numeroDossier || '').toLowerCase().includes(q) || (d.organisation?.nom || '').toLowerCase().includes(q),
    );
  }

  const onglets: [Filtre, string][] = [
    ['toutes', 'Toutes'],
    ['a_remplir', 'À remplir'],
    ['soumises', 'Soumises'],
    ...(n.retires ? ([['retires', 'Retirés']] as [Filtre, string][]) : []),
  ];

  return (
    <>
      <h1 className="gx-page-title">Mes évaluations</h1>
      <p className="gx-page-sub">Fiches de scoring qui vous sont assignées, par numéro de dossier — appel : Cohorte 1.</p>

      {meta?.tronque ? (
        <div className="gx-flash err">
          La liste a atteint sa limite d&apos;affichage : certains dossiers peuvent manquer. Signalez-le à l&apos;équipe projet.
        </div>
      ) : null}

      <div className="gx-filters" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="gx-tabs" style={{ marginBottom: 0 }}>
          {onglets.map(([k, label]) => (
            <button key={k} type="button" className={`gx-tab${filtre === k ? ' on' : ''}`} onClick={() => setFiltre(k)}>
              {label} <span className="gx-n">{n[k]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Numéro de dossier ou organisation…"
          style={{ width: 'auto', minWidth: 240 }}
          aria-label="Rechercher un dossier"
        />
      </div>

      {items.length === 0 ? (
        <div className="gx-empty">Aucun dossier à ces filtres.</div>
      ) : (
        items.map((d) => (
          <div className="gx-drow" key={d.documentId}>
            <div className="gx-main">
              <div className="gx-num">{d.numeroDossier}</div>
              <div className="gx-who">{d.organisation?.nom}</div>
              <div className="gx-meta">
                {d.organisation?.filiere ? <span>{d.organisation.filiere}</span> : null}
                <span>Évaluateur {d.rang}</span>
                {d.retire ? <span>Renvoyé à l&apos;éligibilité par l&apos;UGP — votre fiche est conservée</span> : null}
              </div>
            </div>
            {d.retire ? (
              <span className="gx-pill gx-pill-comp">Retiré de l&apos;évaluation</span>
            ) : d.ficheStatut === 'soumise' ? (
              <span className="gx-pill gx-pill-ok">✓ Soumise &amp; signée</span>
            ) : (
              <span className="gx-pill gx-pill-val">À remplir</span>
            )}
            <Link
              className={`gx-btn gx-btn-sm ${d.ficheStatut === 'soumise' || d.retire ? 'gx-btn-ghost' : 'gx-btn-primary'}`}
              href={`/gestion/evaluations/${d.documentId}`}
            >
              {d.ficheStatut === 'soumise' || d.retire ? 'Consulter' : 'Remplir la fiche'}
            </Link>
          </div>
        ))
      )}

      <p className="gx-annot">
        <b>Indépendance (E3).</b> Vous ne voyez jamais la fiche de l&apos;autre évaluateur avant que vous ayez tous deux soumis.
        L&apos;assignation Évaluateur 1 / 2 est faite par l&apos;UGP (E2).
      </p>
    </>
  );
}
