function MechanismIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'counterpart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          <path d="M7 6h1v4" />
          <path d="M16.71 13.88l.7.71-2.82 2.82" />
        </svg>
      );
    case 'calculator':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
        </svg>
      );
    case 'selection':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 3h5v5" />
          <path d="M8 3H3v5" />
          <path d="M3 16v5h5" />
          <path d="M21 16v5h-5" />
          <path d="M9 9l6 6" />
          <path d="M15 9l-6 6" />
        </svg>
      );
    case 'milestones':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4Z" />
        </svg>
      );
    case 'support':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
        </svg>
      );
    case 'audit':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

const mechanismLines = [
  {
    title: '4 formes de contrepartie',
    text: 'Numéraire, nature, équipements existants ou travaux préparatoires reconnus dans le montage.',
    icon: 'counterpart',
  },
  {
    title: 'Exemple de montage',
    text: 'Projet de 50 M BIF : 40 M BIF financés par le programme, 10 M BIF mobilisés par le porteur.',
    icon: 'calculator',
  },
  {
    title: 'Sélection compétitive',
    text: "Comparaison des dossiers sur l'éligibilité, la viabilité, l'impact, l'inclusion et les exigences environnementales et sociales.",
    icon: 'selection',
    added: true,
  },
  {
    title: 'Décaissement par jalons',
    text: 'Paiements conditionnés aux validations techniques, fiduciaires et environnementales attendues.',
    icon: 'milestones',
  },
  {
    title: 'Assistance technique incluse',
    text: 'Appui au business plan, à la gouvernance et à la mise en oeuvre du projet retenu.',
    icon: 'support',
    added: true,
  },
  {
    title: 'Suivi et audit',
    text: 'Décisions, paiements et résultats documentés pour assurer une traçabilité complète.',
    icon: 'audit',
    added: true,
  },
];

export default function HomeMechanismBand() {
  return (
    <section id="home-mechanism-band" className="section section-band home-mechanism-band">
      <div className="container">
        <div className="home-mechanism-shell">
          <p className="home-mechanism-eyebrow">Comprendre le financement</p>
          <h2 className="section-title home-mechanism-title">La contrepartie en un coup d&apos;oeil</h2>
          <p className="home-mechanism-intro">
            Le programme partage le risque et stimule l&apos;investissement privé : votre contrepartie devient un effet de
            levier directement utile aux MPME de votre filière.
          </p>

          <div className="home-mechanism-bar-card">
            <div className="home-mechanism-bar-track" aria-label="Répartition indicative du financement">
              <div className="home-mechanism-bar-fill">
                <span>80%</span>
              </div>
              <div className="home-mechanism-bar-empty">
                <span>&ge;20%</span>
              </div>
            </div>

            <div className="home-mechanism-legend">
              <div className="home-mechanism-legend-item">
                <span className="home-mechanism-legend-dot fill" aria-hidden="true" />
                <strong>Subvention PRETE</strong>
                <span>prise en charge par le programme</span>
              </div>
              <div className="home-mechanism-legend-item">
                <span className="home-mechanism-legend-dot empty" aria-hidden="true" />
                <strong>Votre contrepartie</strong>
                <span>mobilisée par vous</span>
              </div>
            </div>
          </div>

          <div className="home-mechanism-grid">
            {mechanismLines.map((item) => (
              <article
                key={item.title}
                className={`home-mechanism-card${item.added ? ' is-added' : ''}`}
              >
                <span className="home-mechanism-icon" aria-hidden="true">
                  <MechanismIcon kind={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
