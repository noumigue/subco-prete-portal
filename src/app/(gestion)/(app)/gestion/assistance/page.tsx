import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAssistance } from '@/lib/gestion-api';
import { getPortalCategoriesAssistance } from '@/lib/portal-api';
import { GestionAssistanceListe } from '@/components/gestion-assistance-liste';

export const dynamic = 'force-dynamic';

// File des demandes d'assistance (H1-H3) — ugp + instructeur ; comite exclu (H2).
export default async function AssistancePage() {
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');

  const [rows, categories] = await Promise.all([
    getGestionAssistance(),
    getPortalCategoriesAssistance(),
  ]);

  return (
    <GestionAssistanceListe
      rows={rows}
      categories={categories.map((c) => ({ code: c.code || '', libelle: c.libelle || '' }))}
      userId={session?.userId ?? 0}
    />
  );
}
