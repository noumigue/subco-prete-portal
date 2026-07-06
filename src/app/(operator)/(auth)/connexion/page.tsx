import Link from 'next/link';
import { loginCandidateAction } from '../../actions';
import { OperatorAuthPasswordField } from '@/components/operator-auth-password-field';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const reset = Array.isArray(params.reset) ? params.reset[0] : params.reset;

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card">
        <h1>Se connecter</h1>
        <p className="operator-auth-lead">Accedez a votre espace operateur.</p>
        {reset ? <p className="operator-auth-note">Mot de passe modifie. Vous pouvez vous connecter.</p> : null}
        {error ? <p className="operator-auth-error">{error}</p> : null}
        <form action={loginCandidateAction}>
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" placeholder="nom@organisation.bi" required />
          <OperatorAuthPasswordField id="password" name="password" label="Mot de passe" placeholder="••••••••" required />
          <div className="operator-auth-row-end">
            <Link href="/mot-de-passe-oublie">Mot de passe oublie ?</Link>
          </div>
          <button type="submit" className="operator-primary-btn">Se connecter</button>
        </form>
        <div className="operator-auth-demo">
          <strong>Compte de demo</strong>
          <span>demo-candidat@subco-prete.bi</span>
          <span>SubcoDemo2026!</span>
        </div>
        <p className="operator-auth-alt">Pas encore de compte ? <Link href="/inscription">Creer un compte</Link></p>
        </div>
        <p className="operator-auth-annot"><b>D2.</b> Si l&apos;e-mail n&apos;est pas encore verifie, la connexion reste bloquee et renvoie vers la verification.</p>
      </section>
    </main>
  );
}
