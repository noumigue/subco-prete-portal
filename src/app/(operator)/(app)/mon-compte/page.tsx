import { requirePortalSession } from '@/lib/portal-auth';

export default async function AccountPage() {
  const session = await requirePortalSession();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Mon compte</p>
      <h1>Identité de connexion</h1>
      <section className="operator-card">
        <dl className="operator-detail-grid">
          <div><dt>E-mail</dt><dd>{session.email}</dd></div>
          <div><dt>Rôle</dt><dd>{session.role}</dd></div>
          <div><dt>E-mail vérifié</dt><dd>{session.emailVerified ? 'Oui' : 'Non'}</dd></div>
          <div><dt>Téléphone</dt><dd>{session.phone || 'Non renseigné'}</dd></div>
        </dl>
      </section>
    </div>
  );
}
