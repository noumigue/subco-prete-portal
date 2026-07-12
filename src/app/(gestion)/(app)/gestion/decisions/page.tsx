import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getCurrentAppelId, getDecisions } from '@/lib/gestion-api';
import { GestionDecisionsView } from '@/components/gestion-decisions';

export const dynamic = 'force-dynamic';

export default async function DecisionsPage() {
  const session = await getPortalSession();
  if (session?.role !== 'ugp') redirect('/gestion/dossiers');
  const appelId = await getCurrentAppelId();
  const decisions = appelId ? await getDecisions(appelId) : null;

  if (!appelId || !decisions || !decisions.ready) {
    return (
      <>
        <h1 className="gx-page-title">Décisions du Comité</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Le rapport d&apos;évaluation doit être validé par l&apos;UGP avant la saisie des décisions.</p></div>
      </>
    );
  }
  return <GestionDecisionsView decisions={decisions} appelId={appelId} />;
}
