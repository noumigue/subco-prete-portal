import { notFound, redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionNonObjection } from '@/lib/gestion-api';
import { GestionNonObjectionDetail } from '@/components/gestion-nonobjection-detail';

export const dynamic = 'force-dynamic';

export default async function NonObjectionDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');
  const detail = await getGestionNonObjection(documentId);
  if (!detail) notFound();
  return <GestionNonObjectionDetail detail={detail} canWrite={session?.role === 'ugp'} />;
}
