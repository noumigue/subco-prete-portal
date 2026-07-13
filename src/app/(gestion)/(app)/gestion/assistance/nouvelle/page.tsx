import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAssistanceOperateurs } from '@/lib/gestion-api';
import { getPortalCategoriesAssistance } from '@/lib/portal-api';
import { GestionAssistanceNouvelle } from '@/components/gestion-assistance-nouvelle';

export const dynamic = 'force-dynamic';

// H4 — création d'une demande au nom d'un opérateur (sollicitation téléphonique).
export default async function AssistanceNouvellePage() {
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');

  const [operateurs, categories] = await Promise.all([
    getGestionAssistanceOperateurs(),
    getPortalCategoriesAssistance(),
  ]);

  return (
    <GestionAssistanceNouvelle
      operateurs={operateurs}
      categories={categories.map((c) => ({ documentId: c.documentId, code: c.code || '', libelle: c.libelle || '' }))}
    />
  );
}
