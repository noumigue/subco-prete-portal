import { requirePortalSession } from '@/lib/portal-auth';

export default async function MyGrantPage() {
  const session = await requirePortalSession();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Ma subvention</p>
      <h1>{session.role === 'beneficiaire' ? 'Convention, jalons et décaissements' : 'Section verrouillée'}</h1>
      <section className="operator-card">
        <p className="operator-muted">
          {session.role === 'beneficiaire'
            ? 'Le rôle bénéficiaire ouvre cet espace sans changer de compte.'
            : 'Le shell affiche cette entrée mais la laisse grisée tant que la candidature n’est pas sélectionnée.'}
        </p>
      </section>
    </div>
  );
}
