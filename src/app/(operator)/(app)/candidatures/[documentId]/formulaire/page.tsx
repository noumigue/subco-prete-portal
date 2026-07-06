import { OperatorCandidatureForm } from '@/components/operator-candidature-form';
import { getPortalCandidature, getPortalOpenCalls, getPortalOrganisation, getPortalTypePieces } from '@/lib/portal-api';

export default async function FormMountPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const [candidature, organisation, openCalls, typePieces] = await Promise.all([
    getPortalCandidature(documentId),
    getPortalOrganisation(),
    getPortalOpenCalls(),
    getPortalTypePieces(),
  ]);

  return <OperatorCandidatureForm candidature={candidature} organisation={organisation} openCall={candidature?.appel || openCalls[0] || null} typePieces={typePieces} />;
}
