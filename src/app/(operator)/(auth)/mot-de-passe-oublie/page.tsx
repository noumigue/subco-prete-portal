import Link from 'next/link';
import { requestResetAction } from '../../actions';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = Array.isArray(params.sent) ? params.sent[0] : params.sent;

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card">
        <h1>Mot de passe oublie</h1>
        <p className="operator-auth-lead">Saisissez votre adresse e-mail : si un compte existe, vous recevrez un lien de reinitialisation.</p>
        <form action={requestResetAction}>
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" placeholder="nom@organisation.bi" required />
          <button type="submit" className="operator-primary-btn">Envoyer le lien</button>
        </form>
        {sent ? <p className="operator-auth-note">Si un compte existe pour cette adresse, un lien de reinitialisation vient d&apos;etre envoye.</p> : null}
        <p className="operator-auth-alt"><Link href="/connexion">← Retour a la connexion</Link></p>
        </div>
        <p className="operator-auth-annot"><b>D4.</b> Le message reste neutre pour eviter toute enumeration des comptes.</p>
      </section>
    </main>
  );
}
