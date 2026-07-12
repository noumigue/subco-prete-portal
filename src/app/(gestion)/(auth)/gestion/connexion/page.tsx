import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { loginGestionAction } from '../../../actions';

export const dynamic = 'force-dynamic';

const ERROR_LABELS: Record<string, string> = {
  'acces-gestion': "Cet espace est réservé à l'équipe du projet (instructeurs, UGP). Votre compte n'y a pas accès.",
};

export default async function GestionLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const error = rawError ? ERROR_LABELS[rawError] || rawError : null;

  // Deja connecte comme role interne -> aller directement a son espace.
  const session = await getPortalSession();
  if (session && (session.role === 'instructeur' || session.role === 'ugp')) {
    redirect('/gestion/dossiers');
  }
  if (session && session.role === 'comite') {
    redirect('/gestion/seance');
  }

  return (
    <div className="gx-loginwrap">
      <div>
        <div className="gx-logincard">
          <span className="gx-reserved">🔒 Accès réservé</span>
          <h1>Connexion à l&apos;espace de gestion</h1>
          {error ? <p className="gx-flash err">{error}</p> : null}
          <form action={loginGestionAction}>
            <label htmlFor="email">Adresse e-mail professionnelle</label>
            <input id="email" name="email" type="email" placeholder="prenom.nom@…" required />
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" placeholder="••••••••" required />
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <Link className="gx-back" href="/gestion/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            </div>
            <button type="submit" className="gx-btn gx-btn-primary" style={{ width: '100%', marginTop: 14 }}>Se connecter</button>
          </form>
          <p className="gx-login-note">Les comptes sont créés par l&apos;administration du projet. Aucune inscription possible sur cette page.</p>
          <div className="gx-login-demo">
            <strong>Comptes de démo</strong>
            <span>demo-instructeur@subco-prete.bi · Instructeur</span>
            <span>demo-ugp@subco-prete.bi · UGP</span>
            <span>SubcoDemo2026!</span>
          </div>
        </div>
        <p className="gx-annot" style={{ maxWidth: 410 }}>
          <b>Porte interne.</b> Route dédiée, même socle d&apos;identité (Users &amp; Permissions), rôles internes uniquement
          (<code>instructeur</code>, <code>ugp</code>). Pas d&apos;auto-inscription. MFA = durcissement ultérieur (noté).
        </p>
      </div>
    </div>
  );
}
