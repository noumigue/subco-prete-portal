import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getCurrentAppelId, getPublication } from '@/lib/gestion-api';
import { GestionPublicationView } from '@/components/gestion-publication';

export const dynamic = 'force-dynamic';

export default async function PublicationPage() {
  const session = await getPortalSession();
  if (session?.role !== 'ugp') redirect('/gestion/dossiers');
  const appelId = await getCurrentAppelId();
  const publication = appelId ? await getPublication(appelId) : null;

  if (!appelId || !publication) {
    return (<><h1 className="gx-page-title">Publication des décisions</h1><div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Aucun appel courant.</p></div></>);
  }
  if (!publication.seanceClose) {
    return (
      <>
        <h1 className="gx-page-title">Publication des décisions — {publication.appel.codeCohorte}</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>La séance du Comité doit être close (décisions figées + PV) avant publication.</p></div>
      </>
    );
  }
  return <GestionPublicationView publication={publication} appelId={appelId} />;
}
