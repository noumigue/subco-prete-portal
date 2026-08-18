import Link from 'next/link';
import { registerCandidateAction } from '../../actions';
import { OperatorAuthPasswordField } from '@/components/operator-auth-password-field';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card">
        <h1>Créer un compte</h1>
        <p className="operator-auth-lead">Un seul compte pour candidater et suivre vos dossiers.</p>
        {error ? <p className="operator-auth-error">{error}</p> : null}
        <form action={registerCandidateAction}>
          <label htmlFor="organizationName">Nom de l&apos;organisation <span className="operator-auth-hint">— s&apos;affichera dans votre espace</span></label>
          <input id="organizationName" name="organizationName" type="text" placeholder="Ex. Coopérative Girumwete" required />
          <label htmlFor="email">Adresse e-mail <span className="operator-auth-hint">— votre identifiant de connexion</span></label>
          <input id="email" name="email" type="email" placeholder="nom@organisation.bi" required />
          <OperatorAuthPasswordField
            id="password"
            name="password"
            label="Mot de passe"
            hint="8 caractères minimum"
            minLength={8}
            placeholder="••••••••"
            required
          />
          <label className="operator-auth-check">
            <input type="checkbox" required />
            <span>J&apos;accepte les conditions d&apos;utilisation et la politique de données du projet.</span>
          </label>
          <button type="submit" className="operator-primary-btn">Créer mon compte</button>
        </form>
        <p className="operator-auth-alt">Déjà un compte ? <Link href="/connexion">Se connecter</Link></p>
        </div>
      </section>
    </main>
  );
}
