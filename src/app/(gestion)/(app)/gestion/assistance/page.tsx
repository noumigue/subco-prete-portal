import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAssistance } from '@/lib/gestion-api';
import { getPortalCategoriesAssistance } from '@/lib/portal-api';
import { GestionAssistanceListe } from '@/components/gestion-assistance-liste';

export const dynamic = 'force-dynamic';

// File des demandes d'assistance (H1-H3) — ugp + instructeur ; comite exclu (H2).
export default async function AssistancePage({ searchParams }: { searchParams?: Promise<{ tout?: string }> }) {
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');

  // Par defaut les 50 demandes les plus recentes : tout charger d'un bloc saturait la base
  // (incident du 01/10). Les compteurs par statut, eux, restent comptes sur la totalite.
  const tout = (await searchParams)?.tout === '1';
  const [{ rows, meta }, categories] = await Promise.all([
    getGestionAssistance(tout ? 300 : undefined),
    getPortalCategoriesAssistance(),
  ]);

  return (
    <GestionAssistanceListe
      rows={rows}
      meta={meta}
      tout={tout}
      categories={categories.map((c) => ({ code: c.code || '', libelle: c.libelle || '' }))}
      userId={session?.userId ?? 0}
      role={session?.role === 'ugp' ? 'ugp' : 'instructeur'}
    />
  );
}
