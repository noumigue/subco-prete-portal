import { requirePortalSession } from '@/lib/portal-auth';
import { changeEmailAction, changePasswordAction, logoutAction, updatePhoneAction } from '../../actions';

function flag(params: Record<string, string | string[] | undefined>, key: string) {
  return Array.isArray(params[key]) ? params[key]?.[0] : params[key];
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePortalSession();
  const params = await searchParams;
  const error = flag(params, 'error');
  const emailSent = flag(params, 'email');
  const passwordChanged = flag(params, 'password');
  const phoneSaved = flag(params, 'phone');

  return (
    <div className="operator-page">
      <p className="operator-kicker">Mon compte</p>
      <h1>Identité de connexion</h1>
      <p className="operator-page-intro">Vos identifiants de connexion et votre numéro de notification. Le profil de votre organisation vit dans « Mon organisation ».</p>

      {error ? <p className="operator-auth-error">{error}</p> : null}

      <section className="operator-card">
        <div className="operator-block-title">Adresse e-mail</div>
        {emailSent ? <p className="operator-auth-note">Un lien de vérification a été envoyé à la nouvelle adresse. La connexion basculera après confirmation.</p> : null}
        <form action={changeEmailAction}>
          <div className="operator-form-field">
            <label>E-mail actuel <span className="operator-form-subtle">· votre identifiant de connexion</span></label>
            <input type="email" value={session.email} readOnly disabled />
          </div>
          <div className="operator-form-field">
            <label>Nouvelle adresse e-mail</label>
            <input type="email" name="email" placeholder="nouvelle@organisation.bi" required />
          </div>
          <div className="operator-form-actions">
            <button type="submit" className="operator-secondary-btn inline">Modifier l’e-mail</button>
            <span className="operator-field-note">Changer d’e-mail nécessite de <strong>vérifier la nouvelle adresse</strong> ; l’ancienne reste valide entre-temps.</span>
          </div>
        </form>
      </section>

      <section className="operator-card">
        <div className="operator-block-title">Mot de passe</div>
        {passwordChanged ? <p className="operator-auth-note">Mot de passe modifié.</p> : null}
        <form action={changePasswordAction}>
          <div className="operator-form-field">
            <label>Mot de passe actuel</label>
            <input type="password" name="currentPassword" placeholder="••••••••" required />
          </div>
          <div className="operator-form-grid">
            <div className="operator-form-field">
              <label>Nouveau mot de passe <span className="operator-form-subtle">· 8 caractères min.</span></label>
              <input type="password" name="password" minLength={8} placeholder="••••••••" required />
            </div>
            <div className="operator-form-field">
              <label>Confirmer</label>
              <input type="password" name="passwordConfirmation" minLength={8} placeholder="••••••••" required />
            </div>
          </div>
          <div className="operator-form-actions">
            <button type="submit" className="operator-primary-btn inline">Enregistrer</button>
          </div>
        </form>
      </section>

      <section className="operator-card">
        <div className="operator-block-title">Numéro de notification (SMS)</div>
        {phoneSaved ? <p className="operator-auth-note">Numéro enregistré.</p> : null}
        <form action={updatePhoneAction}>
          <div className="operator-form-field">
            <label>Téléphone <span className="operator-form-subtle">· reçoit les accusés par SMS</span></label>
            <input type="tel" name="phone" defaultValue={session.phone || ''} placeholder="+257 …" required />
          </div>
          <div className="operator-form-actions">
            <button type="submit" className="operator-primary-btn inline">Enregistrer</button>
            <span className="operator-field-note">Renseigné lors de votre première candidature, modifiable ici.</span>
          </div>
        </form>
      </section>

      <section className="operator-card">
        <div className="operator-block-title">Session</div>
        <form action={logoutAction}>
          <button type="submit" className="operator-danger-btn">Se déconnecter</button>
        </form>
      </section>
    </div>
  );
}
