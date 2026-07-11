import Link from 'next/link';
import { requestResetGestionAction } from '../../../actions';

export const dynamic = 'force-dynamic';

export default async function GestionForgotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = params.sent === '1';

  return (
    <div className="gx-loginwrap">
      <div>
        <div className="gx-logincard">
          <span className="gx-reserved">🔒 Accès réservé</span>
          <h1>Mot de passe oublié</h1>
          {sent ? (
            // Message neutre (anti-enumeration D4) : identique que le compte existe ou non.
            <p className="gx-flash">Si un compte est associé à cette adresse, un lien de réinitialisation vient d&apos;être envoyé.</p>
          ) : null}
          <form action={requestResetGestionAction}>
            <label htmlFor="email">Adresse e-mail professionnelle</label>
            <input id="email" name="email" type="email" placeholder="prenom.nom@…" required />
            <button type="submit" className="gx-btn gx-btn-primary" style={{ width: '100%', marginTop: 14 }}>Envoyer le lien</button>
          </form>
          <p className="gx-login-note"><Link className="gx-back" href="/gestion/connexion">← Retour à la connexion</Link></p>
        </div>
      </div>
    </div>
  );
}
