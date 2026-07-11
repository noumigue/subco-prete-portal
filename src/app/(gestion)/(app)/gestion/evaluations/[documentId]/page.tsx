import { notFound } from 'next/navigation';
import { getFicheDetail } from '@/lib/gestion-api';
import { GestionFiche } from '@/components/gestion-fiche';

export const dynamic = 'force-dynamic';

export default async function FichePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const detail = await getFicheDetail(documentId);
  if (!detail) notFound();

  return <GestionFiche detail={detail} />;
}
