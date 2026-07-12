import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAppels, getRapport, resolveAppelId } from '@/lib/gestion-api';
import { GestionRapportView } from '@/components/gestion-rapport';
import { GestionCohorteSelect } from '@/components/gestion-cohorte-select';

export const dynamic = 'force-dynamic';

export default async function RapportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preferId = typeof params.appel === 'string' ? params.appel : undefined;
  const [session, appels] = await Promise.all([getPortalSession(), getGestionAppels()]);
  const role = session?.role === 'ugp' ? 'ugp' : 'instructeur';
  const appelId = await resolveAppelId(preferId);
  const rapport = appelId ? await getRapport(appelId) : null;
  const selector = <GestionCohorteSelect appels={appels} currentId={appelId || ''} base="/gestion/rapport" />;

  if (!appelId || !rapport) {
    return (
      <>
        {selector}
        <h1 className="gx-page-title">Rapport d&apos;évaluation</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Aucun appel courant.</p></div>
      </>
    );
  }
  return (
    <>
      {selector}
      <GestionRapportView rapport={rapport} appelId={appelId} role={role} />
    </>
  );
}
