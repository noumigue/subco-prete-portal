import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getDecisions, getGestionAppels, resolveAppelId } from '@/lib/gestion-api';
import { GestionDecisionsView } from '@/components/gestion-decisions';
import { GestionCohorteSelect } from '@/components/gestion-cohorte-select';

export const dynamic = 'force-dynamic';

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preferId = typeof params.appel === 'string' ? params.appel : undefined;
  const [session, appels] = await Promise.all([getPortalSession(), getGestionAppels()]);
  if (session?.role !== 'ugp') redirect('/gestion/dossiers');
  const appelId = await resolveAppelId(preferId);
  const decisions = appelId ? await getDecisions(appelId) : null;
  const selector = <GestionCohorteSelect appels={appels} currentId={appelId || ''} base="/gestion/decisions" />;

  if (!appelId || !decisions || !decisions.ready) {
    return (
      <>
        {selector}
        <h1 className="gx-page-title">Décisions du Comité</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Le rapport d&apos;évaluation doit être validé par l&apos;UGP avant la saisie des décisions.</p></div>
      </>
    );
  }
  return (
    <>
      {selector}
      <GestionDecisionsView decisions={decisions} appelId={appelId} />
    </>
  );
}
