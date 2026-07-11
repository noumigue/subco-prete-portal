import { notFound, redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getEvaluationAssign } from '@/lib/gestion-api';
import { GestionEvaluationAssign } from '@/components/gestion-evaluation-assign';

export const dynamic = 'force-dynamic';

export default async function EvaluationAssignPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await getPortalSession();
  // Assignation = prérogative UGP (E2). Un instructeur passe par « Mes évaluations ».
  if (session?.role !== 'ugp') redirect('/gestion/evaluations');

  const data = await getEvaluationAssign(documentId);
  if (!data) notFound();

  return <GestionEvaluationAssign data={data} />;
}
