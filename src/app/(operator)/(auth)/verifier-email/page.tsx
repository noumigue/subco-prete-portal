import { resendConfirmationAction } from '../../actions';

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
          <h1>Verifiez votre adresse e-mail</h1>
          <p className="operator-auth-lead">
            Un lien d&apos;activation a ete envoye a <strong className="operator-auth-to">{email || 'votre adresse'}</strong>.
          </p>
          <div className="operator-auth-wall-note">
            Votre compte reste inactif tant que l&apos;adresse n&apos;est pas verifiee. Vous ne pourrez ni acceder a votre espace ni commencer une candidature avant.
          </div>
          {error ? <p className="operator-auth-error">{error}</p> : null}
          {resent ? <p className="operator-auth-note">Un nouveau lien vient d&apos;etre demande.</p> : null}
          <form action={resendConfirmationAction}>
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="operator-secondary-btn">Renvoyer le lien</button>
          </form>
        </div>
        <p className="operator-auth-annot"><b>D2.</b> Cette page reste une porte dure tant que le compte n&apos;est pas confirme.</p>
      </section>
    </main>
  );
}
