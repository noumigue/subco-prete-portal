import { notFound, redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAssistanceDetail } from '@/lib/gestion-api';
import { GestionAssistanceFil } from '@/components/gestion-assistance-fil';

export const dynamic = 'force-dynamic';

// Fil d'une demande d'assistance (miroir de l'écran opérateur, vu de l'autre bout).
export default async function AssistanceFilPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');

  const detail = await getGestionAssistanceDetail(documentId);
  if (!detail) notFound();

  return <GestionAssistanceFil detail={detail} userId={session?.userId ?? 0} />;
}
