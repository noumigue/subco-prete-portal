import { resetPasswordAction } from '../../actions';
import { OperatorAuthPasswordField } from '@/components/operator-auth-password-field';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code || '';
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card">
        <h1>Choisir un nouveau mot de passe</h1>
        <p className="operator-auth-lead">Depuis le lien reçu par e-mail.</p>
        {error ? <p className="operator-auth-error">{error}</p> : null}
        <form action={resetPasswordAction}>
          <input type="hidden" name="code" value={code} />
          <OperatorAuthPasswordField
            id="password"
            name="password"
            label="Nouveau mot de passe"
            hint="8 caractères minimum"
            minLength={8}
            placeholder="••••••••"
            required
          />
          <OperatorAuthPasswordField
            id="passwordConfirmation"
            name="passwordConfirmation"
            label="Confirmer le mot de passe"
            minLength={8}
            placeholder="••••••••"
            required
          />
          <button type="submit" className="operator-primary-btn">Enregistrer</button>
        </form>
        </div>
      </section>
    </main>
  );
}
