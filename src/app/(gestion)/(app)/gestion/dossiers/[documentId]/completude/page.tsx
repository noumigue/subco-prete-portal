import { notFound } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionDossier } from '@/lib/gestion-api';
import { GestionCompletude } from '@/components/gestion-completude';

export const dynamic = 'force-dynamic';

export default async function CompletudePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const [session, dossier] = await Promise.all([getPortalSession(), getGestionDossier(documentId)]);
  if (!dossier) notFound();
  const role = session?.role === 'ugp' ? 'ugp' : 'instructeur';

  return <GestionCompletude dossier={dossier} role={role} />;
}
