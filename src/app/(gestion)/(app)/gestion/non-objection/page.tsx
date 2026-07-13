import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionNonObjections } from '@/lib/gestion-api';
import { GestionNonObjectionRegistre } from '@/components/gestion-nonobjection-registre';

export const dynamic = 'force-dynamic';

// Registre des demandes de non-objection (§6.7) — ugp + instructeur (lecture) ; comité exclu.
export default async function NonObjectionPage() {
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');
  const rows = await getGestionNonObjections();
  return <GestionNonObjectionRegistre rows={rows} canWrite={session?.role === 'ugp'} />;
}
