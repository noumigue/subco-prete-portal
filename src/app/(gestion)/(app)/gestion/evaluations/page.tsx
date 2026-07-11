import Link from 'next/link';
import { getMesEvaluations } from '@/lib/gestion-api';

export const dynamic = 'force-dynamic';

export default async function MesEvaluationsPage() {
  const rows = await getMesEvaluations();

  return (
    <>
      <h1 className="gx-page-title">Mes évaluations</h1>
      <p className="gx-page-sub">Fiches de scoring qui vous sont assignées — appel : Cohorte 1.</p>

      {rows.length === 0 ? (
        <div className="gx-empty">Aucune fiche à évaluer pour le moment.</div>
      ) : (
        rows.map((d) => (
          <div className="gx-drow" key={d.documentId}>
            <div className="gx-main">
              <div className="gx-num">{d.numeroDossier}</div>
              <div className="gx-who">{d.organisation?.nom}</div>
              <div className="gx-meta">
                {d.organisation?.filiere ? <span>{d.organisation.filiere}</span> : null}
                <span>Évaluateur {d.rang}</span>
              </div>
            </div>
            {d.ficheStatut === 'soumise'
              ? <span className="gx-pill gx-pill-ok">✓ Soumise &amp; signée</span>
              : <span className="gx-pill gx-pill-val">À remplir</span>}
            <Link className={`gx-btn gx-btn-sm ${d.ficheStatut === 'soumise' ? 'gx-btn-ghost' : 'gx-btn-primary'}`} href={`/gestion/evaluations/${d.documentId}`}>
              {d.ficheStatut === 'soumise' ? 'Consulter' : 'Remplir la fiche'}
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
