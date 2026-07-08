import Link from 'next/link';
import { ReclamationForm } from '@/components/reclamation-form';

export const metadata = {
  title: 'Réclamations & recours — SUBCO-PRETE',
  description:
    'Mécanisme confidentiel pour contester une décision, signaler une irrégularité ou porter plainte — instruit par l’UGP, distinct du support de la plateforme.',
};

function ClaimCaseIcon({ name }: { name: 'recours' | 'equite' | 'signalement' | 'tiers' }) {
  switch (name) {
    case 'recours':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16" />
          <path d="M8 20h8" />
          <path d="M5 7h14" />
          <path d="M5 7 3 12a2.5 2.5 0 0 0 4 0L5 7Z" />
          <path d="m19 7-2 5a2.5 2.5 0 0 0 4 0l-2-5Z" />
        </svg>
      );
    case 'equite':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 3 2 3H5" />
        </svg>
      );
    case 'signalement':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-3Z" />
          <path d="M12 8.5v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case 'tiers':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
          <path d="M16 5.5a3 3 0 0 1 0 5" />
          <path d="M17 14.2a5 5 0 0 1 4 4.8v1" />
        </svg>
      );
  }
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16.2a3 3 0 0 1 6 0" />
      <path d="M15 10h4" />
      <path d="M15 14h3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

export default function ReclamationsPage() {
  return (
    <main>
      <section className="section section-band" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <p className="eyebrow candidature-bis-eyebrow">Mécanisme de gestion des plaintes</p>
          <h1 className="page-title">Réclamations &amp; recours</h1>
          <p className="hero-vision" style={{ maxWidth: '62ch' }}>
            Un mécanisme confidentiel pour contester une décision, signaler une irrégularité ou porter une plainte —
            instruit par l’UGP, distinct du support de la plateforme.
          </p>
          <div className="claim-hero-meta">
            <span>Confidentiel</span>
            <span>Anonymat possible</span>
            <span>Instruit par l’UGP</span>
          </div>
        </div>
      </section>

      <section className="section claim-band">
        <div className="container">
          <div className="claim-band-head">
            <h2>Un circuit indépendant du support</h2>
            <p>
              Chaque signalement est traité par l’UGP selon une procédure formelle et confidentielle. L’anonymat est
              possible à chaque étape.
            </p>
          </div>

          <div className="claim-account">
            <span className="claim-account-icon">
              <AccountIcon />
            </span>
            <div className="claim-account-text">
              <h3>Vous avez un dossier&nbsp;?</h3>
              <p>
                Pour déposer et <strong>suivre</strong> votre recours depuis votre espace, connectez-vous — vous
                retrouverez les réponses de l’UGP dans vos notifications.
              </p>
            </div>
            <Link className="btn secondary" href="/connexion">
              Se connecter
            </Link>
          </div>

          <h3 className="claim-cases-title">Quand utiliser ce formulaire</h3>
          <div className="claim-grid">
            <article className="claim-case">
              <div className="claim-case-head">
                <span className="claim-case-icon">
                  <ClaimCaseIcon name="recours" />
                </span>
                <h3>Contester une décision</h3>
              </div>
              <p>Recours sur une candidature&nbsp;: demander le réexamen d’une décision qui vous concerne.</p>
            </article>

            <article className="claim-case">
              <div className="claim-case-head">
                <span className="claim-case-icon">
                  <ClaimCaseIcon name="equite" />
                </span>
                <h3>Équité du processus</h3>
              </div>
              <p>Réclamation sur l’équité ou le déroulement de la procédure de sélection.</p>
            </article>

            <article className="claim-case">
              <div className="claim-case-head">
                <span className="claim-case-icon">
                  <ClaimCaseIcon name="signalement" />
                </span>
                <h3>Signaler une irrégularité</h3>
              </div>
              <p>
                Fraude, corruption, conflit d’intérêt ou grief environnemental &amp; social / VBG-EAS-HS.
              </p>
              <span className="claim-case-flag">Anonymat possible</span>
            </article>

            <article className="claim-case">
              <div className="claim-case-head">
                <span className="claim-case-icon">
                  <ClaimCaseIcon name="tiers" />
                </span>
                <h3>Plainte de tiers</h3>
              </div>
              <p>Communauté ou riverain d’une infrastructure — aucun compte requis.</p>
            </article>
          </div>

          <p className="claim-note">
            Pour une simple question d’utilisation de la plateforme, passez plutôt par{' '}
            <Link href="/contact">Contact &amp; support</Link> ou le menu Assistance de votre espace.
          </p>

          <div className="claim-form-panel">
            <div className="claim-form-head">
              <h2 className="claim-form-title">Déposer une réclamation ou un recours</h2>
              <span className="claim-confidential">
                <LockIcon />
                Confidentiel — anonymat possible
              </span>
            </div>
            <ReclamationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
