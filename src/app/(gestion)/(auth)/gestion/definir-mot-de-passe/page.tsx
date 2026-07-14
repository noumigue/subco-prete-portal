import Link from 'next/link';
import { verifierInvitation } from '@/lib/gestion-api';
import { DefinirMotDePasseForm } from '@/components/gestion-invitation';

export const dynamic = 'force-dynamic';

// M7 L2 — activation d'un compte interne invite. Le lien (e-mail) porte un token :
// on le verifie cote serveur, puis le formulaire definit le mot de passe ET confirme le compte.
export default async function DefinirMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = token ? await verifierInvitation(token) : null;

  return (
    <div className="gx-loginwrap">
      <div>
        <div className="gx-logincard">
          <span className="gx-reserved">🔒 Activation de compte</span>
          <h1>Définir mon mot de passe</h1>
          {!token || !invitation ? (
            <>
              <p className="gx-flash">Ce lien d’invitation est invalide ou a expiré. Demandez à l’UGP de vous renvoyer une invitation.</p>
              <p className="gx-login-note"><Link className="gx-back" href="/gestion/connexion">← Retour à la connexion</Link></p>
            </>
          ) : invitation.deja ? (
            <>
              <p className="gx-flash">Ce compte est déjà activé. Vous pouvez vous connecter.</p>
              <p className="gx-login-note"><Link className="gx-back" href="/gestion/connexion">← Aller à la connexion</Link></p>
            </>
          ) : (
            <DefinirMotDePasseForm token={token} email={invitation.email} nom={invitation.nom} />
          )}
        </div>
      </div>
    </div>
  );
}
