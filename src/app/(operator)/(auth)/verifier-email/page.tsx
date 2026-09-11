import Link from 'next/link';
import { OperatorResendLink } from '@/components/operator-resend-link';

// Incident de messagerie du 11/09/2026 : notre hebergeur retient les courriels sortants.
// L'exigence de confirmation a ete levee cote serveur (reglage users-permissions
// `email_confirmation`), donc un compte non confirme peut se connecter. Cette page disait
// l'inverse — « votre compte reste inactif » — et poussait au renvoi en boucle, qui
// declenche la protection anti-abus du relais. Elle invite desormais a se connecter
// directement. A REMETTRE EN ETAT quand la messagerie sera retablie, en meme temps que
// le reglage : voir _livrables/outils/revert-confirmation-email.sh.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email || '';
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const resent = Array.isArray(params.resent) ? params.resent[0] : params.resent;

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card operator-auth-card-wall">
          <div className="operator-auth-badge">✉️</div>
          <h1>Vérifiez votre adresse e-mail</h1>
          <p className="operator-auth-lead">
            Un lien d&apos;activation a été envoyé à <strong className="operator-auth-to">{email || 'votre adresse'}</strong>.
          </p>
          <div className="operator-auth-wall-note">
            Nos courriels connaissent actuellement des retards indépendants de notre volonté.
            <strong> Vous n&apos;avez pas besoin d&apos;attendre ce message : connectez-vous dès maintenant</strong> avec
            votre adresse e-mail et le mot de passe que vous venez de choisir. Pensez aussi à regarder dans vos courriers indésirables.
          </div>
          {error ? <p className="operator-auth-error">{error}</p> : null}
          {resent ? <p className="operator-auth-note">Un nouveau lien vient d&apos;être demandé.</p> : null}
          <Link href="/connexion" className="operator-primary-btn">Me connecter maintenant</Link>
          <p className="operator-auth-alt">Le lien n&apos;est pas arrivé et vous préférez attendre ?</p>
          <OperatorResendLink email={email} justResent={Boolean(resent)} />
        </div>
      </section>
    </main>
  );
}
