import Link from 'next/link';

const openCalls = [
  {
    status: 'AMI ouvert — Cohorte 1',
    deadline: '15 juillet 2026',
    remaining: 'il reste 15 jours',
    cta: "Voir le détail de l'appel",
    href: '/appels',
  },
];

const procedureSteps = [
  {
    title: 'Créer un compte',
    detail: 'Créez votre profil candidat et validez votre contact. Cette étape est rapide et réversible.',
  },
  {
    title: 'Remplir le dossier',
    detail: 'Saisissez les informations en plusieurs parties avec sauvegarde automatique.',
  },
  {
    title: 'Soumettre et suivre',
    detail: "Vous recevez un accusé puis suivez l'avancement de l'instruction.",
  },
  {
    title: 'Décision du comité',
    detail: 'Le projet est examiné selon les critères techniques, administratifs et de conformité.',
  },
];

const constraints = [
  {
    title: 'Cofinancement',
    detail: 'Un apport propre réel doit être attesté dans le dossier (apports en trésorerie, équipements ou travaux).',
  },
  {
    title: 'Usage collectif',
    detail: "L'infrastructure doit bénéficier à une chaîne de valeur ou plusieurs producteurs/MPME.",
  },
  {
    title: 'Délai de dépôt',
    detail: 'Les candidatures déposées après la clôture ne sont pas prises en compte.',
  },
  {
    title: 'Dossier complet',
    detail: 'Une pièce manquante peut bloquer la validation au premier contrôle de complétude.',
  },
];

const documentItems = [
  {
    title: "TdR de l'appel — v1",
    detail: 'PDF · Mis à jour 30 mai 2026',
  },
  {
    title: "Modèle de plan d'affaires",
    detail: 'DOCX · Modèle à remplir',
  },
  {
    title: 'Liste des pièces du dossier',
    detail: 'PDF · Checklist officielle',
  },
  {
    title: "Grilles d'évaluation",
    detail: 'PDF · Éligibilité + technique',
  },
  {
    title: 'Engagement de cofinancement',
    detail: 'DOCX · Modèle à signer',
  },
  {
    title: 'Fiche de screening environnemental et social',
    detail: 'PDF · Auto-évaluation',
  },
];

const profileRows = [
  {
    title: 'Statuts éligibles',
    detail: 'Société, coopérative, association, ONG, ou fournisseur de services liés au dispositif.',
  },
  {
    title: 'Conformité requise',
    detail: 'Documents fiscaux, légaux et statutaires en ordre et joignables avant soumission.',
  },
  {
    title: "Zone d'intervention",
    detail: "Le projet doit s'inscrire dans les territoires et priorités définis dans l'appel.",
  },
];

export default function CandidatureAdopteePage() {
  const heroBandStyle = {
    background:
      'linear-gradient(145deg, rgba(16, 76, 58, 0.86), rgba(19, 102, 74, 0.84)), linear-gradient(160deg, #0c5c47, #0a473a)',
    color: '#e8f7f1',
  };

  const heroIntroTextStyle = {
    color: '#d8efe2',
  };

  const heroKickerStyle = {
    color: '#9ce6c8',
  };

  const heroSecondaryButtonStyle = {
    borderColor: 'rgba(228, 247, 235, 0.6)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ecfff8',
  };

  const finalCardTextStyle = {
    color: '#d7f1e7',
  };

  const finalSecondaryButtonStyle = {
    background: '#ffffff',
    color: 'var(--brand-deep)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
  };

  return (
    <main className="candidature-bis-page">
      <section
        className="section section-band candidature-bis-hero"
        style={heroBandStyle}
      >
        <div className="container page-intro">
          <p className="form-kicker" style={heroKickerStyle}>Déposer une candidature</p>
          <h1>{"Tout ce qu'il faut savoir avant de candidater"}</h1>
          <p style={heroIntroTextStyle}>
            {"Cette page présente la préparation recommandée avant la soumission : prérequis, étapes, documents clés et critères d'éligibilité. La candidature se dépose ensuite via le formulaire en ligne."}
          </p>
          <div className="actions">
            <Link href="/candidatures/nouvelle" className="btn primary" target="_blank" rel="noopener noreferrer" aria-label="Déposer une candidature (nouvel onglet)">Déposer une candidature ↗</Link>
            <Link href="#appels" className="btn secondary" style={heroSecondaryButtonStyle}>Voir les appels</Link>
          </div>
        </div>
      </section>

      {openCalls.map((item) => (
        <section className="section" key={item.status}>
          <div className="container candidature-bis-open-banner-wrap">
            <article className="candidature-bis-open-banner">
              <p className="candidature-bis-open-badge">{item.status}</p>
              <div>
                <p className="candidature-bis-open-meta">Clôture le {item.deadline} — {item.remaining}</p>
                <Link href={item.href} className="candidature-bis-open-link">
                  {item.cta}
                </Link>
              </div>
            </article>
          </div>
        </section>
      ))}

      <section className="section candidature-bis-section-white">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Comment candidater</p>
              <h2 className="section-title">La procédure en 4 étapes</h2>
            </div>
          </div>
          <div className="candidature-bis-steps">
            {procedureSteps.map((step, index) => (
              <article key={step.title} className="candidature-bis-step-card">
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-bis-section-alt">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Avant de vous lancer</p>
              <h2 className="section-title">Contraintes à anticiper</h2>
            </div>
          </div>
          <div className="candidature-bis-constraints">
            {constraints.map((constraint) => (
              <article key={constraint.title} className="candidature-bis-constraint-card">
                <h3>{constraint.title}</h3>
                <p>{constraint.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-bis-section-white">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Pour vous préparer</p>
              <h2 className="section-title">Documents et modèles à télécharger</h2>
            </div>
          </div>
          <div className="candidature-bis-docs">
            {documentItems.map((doc) => (
              <article key={doc.title} className="candidature-bis-doc-card">
                <div>
                  <h3>{doc.title}</h3>
                  <p>{doc.detail}</p>
                </div>
                <svg className="candidature-bis-doc-download" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section candidature-bis-section-alt">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow candidature-bis-eyebrow">Avant de créer votre compte</p>
              <h2 className="section-title">Êtes-vous le profil attendu ?</h2>
            </div>
          </div>
          <p className="candidature-bis-profile-intro">
            {"Les conditions sont cumulatives et vérifiées au démarrage de l'instruction."}
          </p>
          <div className="candidature-bis-profile-grid">
            {profileRows.map((row) => (
              <article key={row.title} className="candidature-bis-profile-card">
                <h3>{row.title}</h3>
                <p>{row.detail}</p>
              </article>
            ))}
          </div>
          <p className="candidature-bis-profile-link">
            Pas sûr de votre éligibilité ? <Link href="/eligibilite">Faire le test rapide →</Link>
          </p>
        </div>
      </section>

      <section className="section section-band candidature-bis-final-band" id="appels">
        <div className="container candidature-bis-final-band-wrap">
          <div className="candidature-bis-final-intro">
            <p className="eyebrow">Étape de soumission</p>
            <h3>Prêt à déposer votre candidature ?</h3>
            <p>Créez votre compte ou connectez-vous pour continuer votre dossier.</p>
          </div>
          <div className="candidature-bis-final-cards">
            <article className="candidature-bis-final-card">
              <h4>{"Je n'ai pas de compte"}</h4>
              <p style={finalCardTextStyle}>Créer un compte et commencer la candidature.</p>
              <Link href="/inscription?next=/candidatures/nouvelle" className="btn primary">Créer mon compte →</Link>
            </article>
            <article className="candidature-bis-final-card">
              <h4>{"J'ai déjà un compte"}</h4>
              <p style={finalCardTextStyle}>Reprendre votre brouillon ou suivre votre dossier.</p>
              <Link href="/connexion?next=/candidatures/nouvelle" className="btn secondary" style={finalSecondaryButtonStyle}>Me connecter →</Link>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
