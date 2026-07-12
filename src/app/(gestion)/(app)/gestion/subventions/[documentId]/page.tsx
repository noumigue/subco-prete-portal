import { notFound } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionSubvention } from '@/lib/gestion-api';
import { GestionSubventionDossier } from '@/components/gestion-subvention-dossier';

export const dynamic = 'force-dynamic';

export default async function SubventionPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const [session, detail] = await Promise.all([getPortalSession(), getGestionSubvention(documentId)]);
  if (!detail) notFound();

  // ugp = actes & fiduciaire ; instructeur = Cabinet (avis technique seul).
  const role: 'ugp' | 'cabinet' = session?.role === 'ugp' ? 'ugp' : 'cabinet';
  return <GestionSubventionDossier detail={detail} role={role} />;
}
