import { requirePortalSession } from '@/lib/portal-auth';

export default async function MyGrantPage() {
  const session = await requirePortalSession();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Ma subvention</p>
      <h1>{session.role === 'beneficiaire' ? 'Convention, jalons et decaissements' : 'Section verrouillee'}</h1>
      <section className="operator-card">
        <p className="operator-muted">
          {session.role === 'beneficiaire'
            ? 'Le role beneficiaire ouvre cet espace sans changer de compte.'
            : 'Le shell affiche cette entree mais la laisse grisee tant que la candidature n est pas selectionnee.'}
        </p>
      </section>
    </div>
  );
}
