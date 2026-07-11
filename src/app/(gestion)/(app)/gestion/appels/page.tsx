import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAppels } from '@/lib/gestion-api';
import { GestionAppels } from '@/components/gestion-appels';

export const dynamic = 'force-dynamic';

export default async function AppelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [session, appels] = await Promise.all([getPortalSession(), getGestionAppels()]);
  const isUgp = session?.role === 'ugp';
  const flash = params.ouvert === '1' ? "Appel ouvert — le CTA « + Nouvelle candidature » apparaît côté portail."
    : params.clos === '1' ? "Appel clos — le CTA candidat disparaît (bandeau « fermé »)." : null;

  return <GestionAppels appels={appels} isUgp={isUgp} flash={flash} />;
}
