import Link from 'next/link';
import { confirmPortalEmailChange } from '@/lib/portal-api';

// Confirmation du changement d'e-mail (D2) — hors session : le lien peut etre ouvert
// depuis n'importe quel navigateur. La garde est le token (secret), verifie cote CMS.
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = (Array.isArray(params.token) ? params.token[0] : params.token) || '';
  const result = token ? await confirmPortalEmailChange(token) : { ok: false, error: 'Lien invalide.' };

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card operator-auth-card-wall">
          <div className="operator-auth-badge">{result.ok ? '✓' : '✉️'}</div>
          <h1>{result.ok ? 'Adresse e-mail confirmée' : 'Lien invalide'}</h1>
          {result.ok ? (
            <p className="operator-auth-lead">
              Votre nouvelle adresse <strong className="operator-auth-to">{result.email}</strong> est désormais votre identifiant de connexion.
            </p>
          ) : (
            <p className="operator-auth-error">{result.error || 'Ce lien est invalide ou a déjà été utilisé.'}</p>
          )}
          <Link href="/connexion" className="operator-primary-btn">Se connecter</Link>
        </div>
      </section>
    </main>
  );
}
