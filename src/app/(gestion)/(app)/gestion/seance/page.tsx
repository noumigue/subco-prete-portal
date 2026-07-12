import { getSeanceCourante } from '@/lib/gestion-api';
import { GestionSeanceView } from '@/components/gestion-seance';

export const dynamic = 'force-dynamic';

export default async function SeancePage() {
  const seance = await getSeanceCourante();

  if (!seance || !seance.ready) {
    return (
      <>
        <h1 className="gx-page-title">Dossier de séance — Comité</h1>
        <div className="gx-card"><p style={{ margin: 0, color: 'var(--muted-warm)', fontSize: 13.5 }}>
          Le rapport d&apos;évaluation n&apos;a pas encore été validé par l&apos;UGP. Le dossier de séance sera disponible dès sa validation.
        </p></div>
      </>
    );
  }
  return <GestionSeanceView seance={seance} />;
}
