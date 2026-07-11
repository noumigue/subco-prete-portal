import { getPortalSession } from '@/lib/portal-auth';
import { logoutGestionAction } from '../../../actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = { instructeur: 'Instructeur · Cabinet', ugp: 'UGP · Validation' };

export default async function GestionMonComptePage() {
  const session = await getPortalSession();

  return (
    <>
      <h1 className="gx-page-title">Mon compte</h1>
      <p className="gx-page-sub">Compte interne provisionné par l&apos;administration du projet.</p>

      <div className="gx-card">
        <div className="gx-block-title">Identité</div>
        <div className="gx-recap">
          <b>{session?.orgName}</b><br />
          {session?.email}<br />
          Rôle : {session ? ROLE_LABEL[session.role] || session.role : '—'}
        </div>
        <form action={logoutGestionAction} style={{ marginTop: 14 }}>
          <button type="submit" className="gx-btn gx-btn-ghost">Se déconnecter</button>
        </form>
      </div>

      <p className="gx-annot">
        <b>Porte interne.</b> La gestion des comptes, des rôles et le durcissement (MFA) relèvent de l&apos;administration du projet
        (durcissement ultérieur — noté). Le changement de mot de passe réutilise la mécanique commune.
      </p>
    </>
  );
}
