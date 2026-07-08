import Link from 'next/link';

export const metadata = {
  title: 'Contact & support — SUBCO-PRETE',
  description:
    'Les trois canaux pour joindre le programme : support de la plateforme, réclamations & recours, et contact institutionnel avec l’UGP PRETE.',
};

function ContactChannelIcon({ name }: { name: 'support' | 'reclamation' | 'ugp' }) {
  switch (name) {
    case 'support':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <rect x="3" y="14" width="4" height="6" rx="1.6" />
          <rect x="17" y="14" width="4" height="6" rx="1.6" />
          <path d="M19 20a2 2 0 0 1-2 2h-4" />
        </svg>
      );
    case 'reclamation':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v18" />
          <path d="M8 21h8" />
          <path d="M4 7h16" />
          <path d="M6 7 3.5 13a2.9 2.9 0 0 0 5 0L6 7Z" />
          <path d="m18 7-2.5 6a2.9 2.9 0 0 0 5 0L18 7Z" />
        </svg>
      );
    case 'ugp':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M4 18h16" />
          <path d="M6 18v-7" />
          <path d="M10 18v-7" />
          <path d="M14 18v-7" />
          <path d="M18 18v-7" />
          <path d="m12 3 8 5H4l8-5Z" />
        </svg>
      );
  }
}

export default function ContactPage() {
  return (
    <main>
      <section className="section section-band" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <p className="eyebrow candidature-bis-eyebrow">Contact &amp; support</p>
          <h1 className="page-title">Nous contacter</h1>
          <p className="hero-vision" style={{ maxWidth: '62ch' }}>
            Trois canaux, selon votre besoin&nbsp;: le support pour utiliser la plateforme, les réclamations &amp; recours
            pour contester ou signaler, l’UGP pour les échanges institutionnels.
          </p>
          <div className="contact-hero-meta">
            <span>Support par e-mail et espace opérateur</span>
            <span>Réclamations instruites par l’UGP</span>
            <span>FAQ &amp; ressources en libre accès</span>
          </div>
        </div>
      </section>

      <section className="section contact-band">
        <div className="container">
          <div className="contact-band-head">
            <h2>Choisir le bon canal</h2>
            <p>
              Chaque demande suit un circuit dédié. L’orienter vers le bon canal dès le départ, c’est la garantie d’un
              traitement plus rapide.
            </p>
          </div>

          <div className="contact-grid">
            <article className="contact-card contact-card--primary">
              <div className="contact-card-head">
                <span className="contact-icon">
                  <ContactChannelIcon name="support" />
                </span>
                <div>
                  <span className="contact-card-tag">Canal principal</span>
                  <h3>Support de la plateforme</h3>
                  <p className="contact-card-sub">
                    Pour toute question sur l’utilisation du portail&nbsp;: éligibilité, dépôt d’une candidature, suivi de
                    dossier.
                  </p>
                </div>
              </div>

              <div className="contact-steps">
                <div className="contact-step">
                  <span className="contact-step-num">1</span>
                  <h4>Consultez d’abord la FAQ</h4>
                  <p>
                    La plupart des réponses s’y trouvent déjà — voir la <Link href="/faq">FAQ</Link> et les{' '}
                    <Link href="/ressources">documents &amp; ressources</Link>.
                  </p>
                </div>
                <div className="contact-step">
                  <span className="contact-step-num">2</span>
                  <h4>Vous avez un compte&nbsp;?</h4>
                  <p>
                    Ouvrez une demande depuis le menu <strong>Assistance</strong> de votre espace opérateur&nbsp;: elle est
                    rattachée à votre dossier et suivie par l’équipe.
                  </p>
                </div>
                <div className="contact-step">
                  <span className="contact-step-num">3</span>
                  <h4>Pas encore de compte&nbsp;?</h4>
                  <p>
                    Vous n’avez pas de compte, ou votre question ne concerne aucun dossier en cours&nbsp;? Écrivez au
                    support&nbsp;: l’équipe vous répond par e-mail.
                  </p>
                </div>
              </div>

              <div className="contact-card-actions">
                <a className="btn primary" href="mailto:support@subco-prete.bi">
                  Écrire à support@subco-prete.bi
                </a>
                <Link className="btn secondary" href="/faq">
                  Consulter la FAQ
                </Link>
              </div>
            </article>

            <article className="contact-card contact-card--distinct">
              <div className="contact-card-head">
                <span className="contact-icon">
                  <ContactChannelIcon name="reclamation" />
                </span>
                <div>
                  <span className="contact-card-tag">Circuit indépendant</span>
                  <h3>Réclamations &amp; recours</h3>
                  <p className="contact-card-sub">
                    Pour contester une décision ou signaler une irrégularité — y compris de façon anonyme.
                  </p>
                </div>
              </div>

              <p className="contact-card-body">
                Ce circuit est indépendant du support de la plateforme&nbsp;: chaque réclamation est instruite par l’UGP,
                selon une procédure formelle et confidentielle.
              </p>

              <div className="contact-card-actions">
                <Link className="btn" href="/reclamations">
                  Déposer une réclamation →
                </Link>
              </div>
              <p className="contact-card-note">Confidentiel — l’anonymat est possible à chaque étape.</p>
            </article>

            <article className="contact-card contact-card--ugp">
              <div className="contact-card-head">
                <span className="contact-icon">
                  <ContactChannelIcon name="ugp" />
                </span>
                <div>
                  <span className="contact-card-tag">Institutionnel</span>
                  <h3>Unité de Gestion du Projet (UGP)</h3>
                  <p className="contact-card-sub">Projet PRETE — Nyunganira, financé par la Banque mondiale.</p>
                </div>
              </div>

              <p className="contact-card-body">
                L’UGP pilote le programme, supervise la plateforme SUBCO-PRETE et reste l’interlocuteur des partenaires
                institutionnels.
              </p>

              <div className="contact-card-actions">
                <a className="contact-mail-link" href="mailto:subco@prete.bi">
                  UGP PRETE · subco@prete.bi
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
