import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getConsolidation } from '@/lib/gestion-api';
import { GestionConsolidation } from '@/components/gestion-consolidation';

export const dynamic = 'force-dynamic';

export default async function ConsolidationPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await getPortalSession();
  // Consolidation = rôle ugp/Cabinet (E5). L'indépendance E3 interdit l'accès évaluateur.
  if (session?.role !== 'ugp') redirect('/gestion/evaluations');

  const data = await getConsolidation(documentId);
  if (!data) notFound();

  if (!data.ready) {
    return (
      <>
        <Link className="gx-back" href="/gestion/dossiers">← File des dossiers</Link>
        <h1 className="gx-page-title">Consolidation</h1>
        <div className="gx-card"><p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted-warm)' }}>
          La consolidation n&apos;est accessible qu&apos;une fois les deux fiches de scoring soumises (E3).
        </p></div>
      </>
    );
  }

  return <GestionConsolidation data={data} />;
}
