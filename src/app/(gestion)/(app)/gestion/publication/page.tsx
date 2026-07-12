import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAppels, getPublication, resolveAppelId } from '@/lib/gestion-api';
import { GestionPublicationView } from '@/components/gestion-publication';
import { GestionCohorteSelect } from '@/components/gestion-cohorte-select';

export const dynamic = 'force-dynamic';

export default async function PublicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preferId = typeof params.appel === 'string' ? params.appel : undefined;
  const [session, appels] = await Promise.all([getPortalSession(), getGestionAppels()]);
  if (session?.role !== 'ugp') redirect('/gestion/dossiers');
  const appelId = await resolveAppelId(preferId);
  const publication = appelId ? await getPublication(appelId) : null;
  const selector = <GestionCohorteSelect appels={appels} currentId={appelId || ''} base="/gestion/publication" />;

  if (!appelId || !publication) {
    return (<>{selector}<h1 className="gx-page-title">Publication des décisions</h1><div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>Aucun appel courant.</p></div></>);
  }
  if (!publication.seanceClose) {
    return (
      <>
        {selector}
        <h1 className="gx-page-title">Publication des décisions — {publication.appel.codeCohorte}</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>La séance du Comité doit être close (décisions figées + PV) avant publication.</p></div>
      </>
    );
  }
  return (
    <>
      {selector}
      <GestionPublicationView publication={publication} appelId={appelId} />
    </>
  );
}
