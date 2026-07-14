import { notFound } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionSubvention } from '@/lib/gestion-api';
import { GestionSubventionDossier } from '@/components/gestion-subvention-dossier';

export const dynamic = 'force-dynamic';

export default async function SubventionPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { documentId } = await params;
  const { onglet } = await searchParams;
  const [session, detail] = await Promise.all([getPortalSession(), getGestionSubvention(documentId)]);
  if (!detail) notFound();

  // Deep-link depuis les alertes S&E (?onglet=mesures|jalons) : ouvre le bon onglet.
  const initialSubview = onglet === 'mesures' || onglet === 'jalons' ? onglet : 'exec';

  // ugp = actes & fiduciaire ; instructeur = Cabinet (avis technique seul).
  const role: 'ugp' | 'cabinet' = session?.role === 'ugp' ? 'ugp' : 'cabinet';
  return <GestionSubventionDossier detail={detail} role={role} initialSubview={initialSubview} />;
}
