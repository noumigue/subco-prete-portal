import { getPortalSession } from '@/lib/portal-auth';
import { getCurrentAppelId, getRapport } from '@/lib/gestion-api';
import { GestionRapportView } from '@/components/gestion-rapport';

export const dynamic = 'force-dynamic';

export default async function RapportPage() {
  const session = await getPortalSession();
  const role = session?.role === 'ugp' ? 'ugp' : 'instructeur';
  const appelId = await getCurrentAppelId();
  const rapport = appelId ? await getRapport(appelId) : null;

  if (!appelId || !rapport) {
    return (
      <>
        <h1 className="gx-page-title">Rapport d&apos;évaluation</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Aucun appel courant.</p></div>
      </>
    );
  }
  return <GestionRapportView rapport={rapport} appelId={appelId} role={role} />;
}
