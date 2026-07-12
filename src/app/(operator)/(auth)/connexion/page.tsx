import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginCandidateAction } from '../../actions';
import { getPortalSession } from '@/lib/portal-auth';
import { OperatorAuthPasswordField } from '@/components/operator-auth-password-field';

function safeNext(value?: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  // Garde d'acces operateur (remediation 2.4) : message lisible pour un role non-operateur.
  const error = rawError === 'acces-operateur'
    ? "Cet espace est réservé aux opérateurs (candidats et bénéficiaires). Votre compte n'y a pas accès."
    : rawError;
  const reset = Array.isArray(params.reset) ? params.reset[0] : params.reset;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);

  // Déjà connecté en tant qu'operateur → aller directement a la destination voulue.
  // Un role interne (instructeur/ugp/...) n'est PAS redirige vers (app) (evite la boucle
  // avec la garde d'acces) : il reste sur cette page avec le message d'acces.
  const session = await getPortalSession();
  if (session && (session.role === 'candidat' || session.role === 'beneficiaire')) {
    redirect(next || '/tableau-de-bord');
  }

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card">
        <h1>Se connecter</h1>
        <p className="operator-auth-lead">Accédez à votre espace opérateur.</p>
        {reset ? <p className="operator-auth-note">Mot de passe modifié. Vous pouvez vous connecter.</p> : null}
        {error ? <p className="operator-auth-error">{error}</p> : null}
        <form action={loginCandidateAction}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" placeholder="nom@organisation.bi" required />
          <OperatorAuthPasswordField id="password" name="password" label="Mot de passe" placeholder="••••••••" required />
          <div className="operator-auth-row-end">
            <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </div>
          <button type="submit" className="operator-primary-btn">Se connecter</button>
        </form>
        <div className="operator-auth-demo">
          <strong>Compte de démo</strong>
          <span>demo-candidat@subco-prete.bi</span>
          <span>SubcoDemo2026!</span>
        </div>
        <p className="operator-auth-alt">Pas encore de compte ? <Link href="/inscription">Créer un compte</Link></p>
        {/* Couture G3 : rattrape une erreur d'aiguillage vers la porte interne. */}
        <p className="operator-auth-alt">Membre de l&apos;équipe du projet ? <Link href="/gestion/connexion">Espace de gestion</Link></p>
        </div>
        <p className="operator-auth-annot"><b>D2.</b> Si l&apos;e-mail n&apos;est pas encore vérifié, la connexion reste bloquée et renvoie vers la vérification.</p>
      </section>
    </main>
  );
}
