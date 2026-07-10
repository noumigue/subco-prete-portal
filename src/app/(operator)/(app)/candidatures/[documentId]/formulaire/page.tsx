import { OperatorCandidatureForm } from '@/components/operator-candidature-form';
import {
  getPortalCandidature,
  getPortalContenuAide,
  getPortalFilieres,
  getPortalOpenCalls,
  getPortalOrganisation,
  getPortalProvinces,
  getPortalStatutJuridiques,
  getPortalTypeContreparties,
  getPortalTypePieces,
} from '@/lib/portal-api';
import { requirePortalSession } from '@/lib/portal-auth';
import type { PortalContenuAide } from '@/lib/portal-types';

// Exemples d'infrastructure (3.1.3) : texte editorial servi par `contenu-aide`
// (cle `exemples-infrastructure`) — jamais une liste imposee. Un item de liste = une ligne ;
// un paragraphe unique se decoupe sur les virgules.
function extractExamples(contenu: PortalContenuAide | null): string[] {
  const blocks = contenu?.corps || [];
  const lines: string[] = [];

  for (const block of blocks) {
    if (block.type === 'list') {
      for (const item of block.children || []) {
        const text = ((item as { children?: { text?: string }[] }).children || [])
          .map((child) => child.text || '')
          .join('')
          .trim();
        if (text) lines.push(text);
      }
    } else {
      const text = (block.children || []).map((child) => child.text || '').join('').trim();
      if (text) lines.push(text);
    }
  }

  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0]
      .replace(/\.$/, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return lines;
}

export default async function FormMountPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const session = await requirePortalSession();
  const [candidature, organisation, openCalls, typePieces, provinces, statutJuridiques, filieres, typeContreparties, contenuAide] =
    await Promise.all([
      getPortalCandidature(documentId),
      getPortalOrganisation(),
      getPortalOpenCalls(),
      getPortalTypePieces(),
      getPortalProvinces(),
      getPortalStatutJuridiques(),
      getPortalFilieres(),
      getPortalTypeContreparties(),
      getPortalContenuAide('exemples-infrastructure'),
    ]);

  return (
    <OperatorCandidatureForm
      candidature={candidature}
      organisation={organisation}
      openCall={candidature?.appel || openCalls[0] || null}
      typePieces={typePieces}
      provinces={provinces}
      statutJuridiques={statutJuridiques}
      filieres={filieres}
      typeContreparties={typeContreparties}
      infraExemples={extractExamples(contenuAide)}
      session={session}
    />
  );
}
