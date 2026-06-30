import Link from 'next/link';
import type { CSSProperties } from 'react';
import HomeMechanismBand from './HomeMechanismBand';
import {
  getCalls,
  getEvents,
  getFaqs,
  getHomepage,
  getNews,
  getPartners,
  getValueChains,
  mediaUrl,
} from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';

type HeroStyle = CSSProperties & {
  '--hero-photo'?: string;
};

const expectedResults = [
  {
    title: 'Infrastructures productives renforcées',
    text: 'Appuyer les équipements, services et capacités qui structurent les chaînes de valeur prioritaires.',
  },
  {
    title: 'MPME mieux connectées aux marchés',
    text: 'Faciliter l’accès à des débouchés plus fiables grâce à la qualité, la traçabilité et la logistique.',
  },
  {
    title: 'Emplois et inclusion',
    text: 'Encourager des projets capables de créer des opportunités pour les jeunes, les femmes et les acteurs locaux.',
  },
];

function InfrastructureIcon({ kind }: { kind?: string }) {
  switch (kind) {
    case 'factory':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V10l5 3V8l5 3V6l4 2v13" />
          <path d="M8 21v-4" />
          <path d="M12 21v-3" />
          <path d="M16 21v-5" />
        </svg>
      );
    case 'warehouse':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10 12 4l9 6" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-5h6v5" />
          <path d="M8 12h.01" />
          <path d="M16 12h.01" />
        </svg>
      );
    case 'truck':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h11v8H3z" />
          <path d="M14 10h3l3 3v2h-6" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'badge':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 18h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 8.5 4.5 4.5 0 0 0 7 18Z" />
          <path d="M12 11v6" />
          <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
        </svg>
      );
    case 'training':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 8 9-4 9 4-9 4-9-4Z" />
          <path d="M7 10v4c0 1.8 2.2 3 5 3s5-1.2 5-3v-4" />
          <path d="M21 9v6" />
        </svg>
      );
    case 'connect':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="7" height="5" rx="1" />
          <rect x="14" y="5" width="7" height="5" rx="1" />
          <rect x="8.5" y="14" width="7" height="5" rx="1" />
          <path d="M6.5 10v2h9v2" />
          <path d="M17.5 10v2h-9" />
        </svg>
      );
    case 'more':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
    default:
      return null;
  }
}

const infrastructureHighlights = [
  {
    title: 'Production et transformation',
    text: 'Unités de production, transformation agroalimentaire ou minière, ateliers mutualisés.',
    icon: 'factory',
  },
  {
    title: 'Stockage et conservation',
    text: 'Entrepôts, chambres froides, silos, centres de collecte et solutions de conservation partagée.',
    icon: 'warehouse',
  },
  {
    title: 'Logistique et commercialisation',
    text: 'Plateformes logistiques, marchés, transport adapté, agrégation et mise en marché.',
    icon: 'truck',
  },
  {
    title: 'Qualité et certification',
    text: 'Laboratoires, contrôle qualité, inspection, traçabilité et mise en conformité.',
    icon: 'badge',
  },
  {
    title: 'Numérique et e-commerce',
    text: 'Plateformes digitales, systèmes de gestion et e-commerce au service des MPME.',
    icon: 'cloud',
  },
  {
    title: 'Formation et conseil',
    text: 'Formation, mentorat, assistance technique et accompagnement liés au projet.',
    icon: 'training',
  },
  {
    title: 'Infrastructure immatérielle',
    text: 'Eligible si l’usage est collectif et utile aux MPME, sous validation du programme.',
    icon: 'connect',
  },
  {
    title: 'Et bien d’autres...',
    text: 'Toute infrastructure à usage collectif ou partagé, sous validation du programme.',
    open: true,
    icon: 'more',
  },
];

const infraSectionStyle: CSSProperties = {
  backgroundColor: '#f2f7ef',
};

const infraWrapStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
};

const infraListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: '0.72rem',
  gridTemplateColumns: 'repeat(2, minmax(250px, 1fr))',
};

const infraItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px 1fr',
  gap: '0.7rem',
  alignItems: 'start',
  border: '1px solid rgba(95, 108, 122, 0.22)',
  borderRadius: '10px',
  backgroundColor: '#fff',
  padding: '0.85rem',
  minWidth: 0,
  boxShadow: '0 6px 20px rgba(20, 43, 33, 0.04)',
};

const infraOpenItemStyle: CSSProperties = {
  borderColor: '#aad8c4',
  backgroundColor: '#ecf8f2',
};

const callBandSectionStyle: CSSProperties = {
  background: '#ffffff',
};

const callBandContainerStyle: CSSProperties = {
  display: 'grid',
  gap: '0.9rem',
};

const callBandFeaturedStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '1rem',
  alignItems: 'start',
  border: '1px solid var(--line)',
  borderRadius: '12px',
  background: '#fbfaf7',
  padding: '1rem',
};

const callBandStatusStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  borderRadius: '999px',
  border: '1px solid var(--brand)',
  color: 'var(--brand-deep)',
  background: '#ecfaf4',
  fontWeight: 700,
  fontSize: '0.72rem',
  padding: '0.22rem 0.7rem',
  lineHeight: 1.2,
};

const callBandCountdownStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid #f0d29d',
  borderRadius: '999px',
  color: '#7b4a09',
  background: '#fef7e8',
  fontSize: '0.82rem',
  fontWeight: 700,
  padding: '0.45rem 0.75rem',
};

const callBandMetaStyle: CSSProperties = {
  margin: 0,
  color: 'var(--ink-soft)',
  lineHeight: 1.45,
};

const callBandTitleStyle: CSSProperties = {
  margin: '0.55rem 0 0.45rem',
  fontSize: 'clamp(1.08rem, 2.2vw, 1.4rem)',
  lineHeight: 1.25,
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};

const callBandItemTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  lineHeight: 1.3,
};

const callBandHistoryListStyle: CSSProperties = {
  marginTop: '0.55rem',
  display: 'grid',
  gap: '0.6rem',
};

const callBandHistoryRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0.8rem',
  alignItems: 'center',
  border: '1px solid var(--line)',
  borderRadius: '12px',
  background: '#f7f8f2',
  padding: '0.75rem 0.85rem',
  isolation: 'isolate' as const,
};

const callBandHistoryRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const callBandPillBaseStyle: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '999px',
  padding: '0.28rem 0.62rem',
  fontSize: '0.74rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--ink-soft)',
};

const callBandPillOpenStyle: CSSProperties = {
  color: '#0b6a4b',
  background: '#e9f6f1',
  borderColor: '#9dd8c5',
};

const callBandPillClosedStyle: CSSProperties = {
  color: '#6d6a62',
  background: '#f7f2ec',
  borderColor: '#e1d8c9',
};

const callBandClosedStyle: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '999px',
  padding: '0.3rem 0.55rem',
  color: 'var(--ink-soft)',
  fontSize: '0.75rem',
};

const callBandEmptyStyle: CSSProperties = {
  border: '1px dashed var(--line)',
  borderRadius: '12px',
  background: '#f7f8f2',
  padding: '0.95rem 1rem',
  color: 'var(--ink-soft)',
};

const callBandEmptyTitleStyle: CSSProperties = {
  margin: 0,
  color: 'var(--ink)',
  fontWeight: 700,
};

const callBandEmptyIntroStyle: CSSProperties = {
  display: 'block',
  marginTop: '0.3rem',
  fontSize: '0.95rem',
};

const callBandEyebrowStyle: CSSProperties = {
  color: 'var(--ink-soft)',
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const infraItemTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.2,
  overflowWrap: 'anywhere',
};

const infraItemTextStyle: CSSProperties = {
  margin: '0.35rem 0 0',
  color: 'var(--ink-soft)',
  lineHeight: 1.45,
  overflowWrap: 'anywhere',
};

const infraIconStyle: CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '999px',
  display: 'grid',
  placeItems: 'center',
  background: '#e8f3ea',
  border: '1px solid #c4dfd1',
  fontSize: '0.85rem',
  lineHeight: 1,
  flex: '0 0 32px',
};

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

type NormalizedCallStatus = 'open' | 'closed' | 'upcoming';

function toDaysRemaining(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days >= 0 ? `J-${days}` : 'Clôturé';
}

function normalizeCallStatus(value?: string): NormalizedCallStatus {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'open') return 'open';
  if (normalized === 'closed') return 'closed';
  if (normalized === 'upcoming' || normalized === 'a_venir' || normalized === 'à venir') return 'upcoming';
  return 'upcoming';
}

function isFutureDate(value?: string, now = new Date()) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > now.getTime();
}

function resolveCallStatus(value?: string, openingDate?: string, deadlineDate?: string) {
  const status = normalizeCallStatus(value);
  if (isPastDeadline(deadlineDate)) return 'closed';
  if (status === 'closed') return 'closed';
  if (isFutureDate(openingDate)) return 'upcoming';
  if (status === 'open') return 'open';
  if (status === 'upcoming') return 'upcoming';
  if (deadlineDate) return 'open';
  return status;
}

function isPastDeadline(value?: string, now = new Date()) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < now.getTime();
}

function toCallStateLabel(value?: string, openingDate?: string, deadlineDate?: string) {
  const status = resolveCallStatus(value, openingDate, deadlineDate);
  if (status === 'open') return 'Ouvert';
  if (status === 'closed') return 'Clôturé';
  return 'À venir';
}

function toUpcomingBadgeLabel(openingDate?: string) {
  return openingDate ? `À venir • ${toDateLabel(openingDate)}` : 'À venir';
}

function sortHomeCalls(
  a: { id: number; callStatus?: string; openingDate?: string; deadlineDate?: string },
  b: { id: number; callStatus?: string; openingDate?: string; deadlineDate?: string },
) {
  const statusOrder = (status?: string, openingDate?: string, deadlineDate?: string) => {
    const resolved = resolveCallStatus(status, openingDate, deadlineDate);
    if (resolved === 'open') return 0;
    if (resolved === 'upcoming') return 1;
    return 2;
  };

  const statusDiff = statusOrder(a.callStatus, a.openingDate, a.deadlineDate) - statusOrder(b.callStatus, b.openingDate, b.deadlineDate);
  if (statusDiff !== 0) return statusDiff;

  const resolvedA = resolveCallStatus(a.callStatus, a.openingDate, a.deadlineDate);
  const resolvedB = resolveCallStatus(b.callStatus, b.openingDate, b.deadlineDate);

  const primaryDateA = resolvedA === 'upcoming' ? a.openingDate : a.deadlineDate;
  const primaryDateB = resolvedB === 'upcoming' ? b.openingDate : b.deadlineDate;
  const timeA = primaryDateA ? new Date(primaryDateA).getTime() : Number.POSITIVE_INFINITY;
  const timeB = primaryDateB ? new Date(primaryDateB).getTime() : Number.POSITIVE_INFINITY;

  if (resolvedA === 'closed' && resolvedB === 'closed') {
    if (timeA !== timeB) return timeB - timeA;
  } else if (timeA !== timeB) {
    return timeA - timeB;
  }

  return String(b.id).localeCompare(String(a.id), 'en');
}

function isDisplayableCall(call: { callStatus?: string; openingDate?: string; deadlineDate?: string }) {
  return ['open', 'closed', 'upcoming'].includes(resolveCallStatus(call.callStatus, call.openingDate, call.deadlineDate));
}

export default async function HomePage() {
  const [homepage, chains, calls, partners, events, news, faqs] = await Promise.all([
    getHomepage(),
    getValueChains(),
    getCalls(),
    getPartners(),
    getEvents(),
    getNews(),
    getFaqs(),
  ]);
  const transversalChain = chains.find((item) => item.slug === 'projet-transversal');
  const homepageChains = [
    ...chains.filter((item) => item.slug !== 'projet-transversal').slice(0, 5),
    ...(transversalChain ? [transversalChain] : []),
  ];
  const heroImage = mediaUrl(homepage?.heroImage) || mediaUrl(chains.find((item) => mediaUrl(item.heroImage))?.heroImage);
  const heroStyle: HeroStyle | undefined = heroImage
    ? {
        '--hero-photo': `url(${heroImage})`,
      }
    : undefined;
  const displayableCalls = calls.filter(isDisplayableCall);
  const orderedCalls = [...displayableCalls].sort(sortHomeCalls);
  const featuredCall = orderedCalls[0];
  const featuredCallStatus = resolveCallStatus(featuredCall?.callStatus, featuredCall?.openingDate, featuredCall?.deadlineDate);
  const featuredCallCountdown = toDaysRemaining(featuredCall?.deadlineDate);
  const pastCalls = orderedCalls.filter((item) => item.id !== featuredCall?.id).slice(0, 8);

  return (
    <main className="min-h-screen">
      <section
        id="home-top"
        className="hero hero-template"
        style={heroStyle}
      >
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">SUBCO PRETE</p>
              <h1>{homepage?.heroTitle || 'Plateforme de subventions de contrepartie'}</h1>
              <p className="hero-vision">
                {homepage?.heroSubtitle || 'PRETE SUBCO catalyse la transformation productive locale en finançant des investissements structurants au service des chaînes de valeur prioritaires, de l’emploi et de la compétitivité durable.'}
              </p>
              <div className="actions">
                <Link href="/eligibilite" className="btn ghost">Vérifier mon éligibilité</Link>
                <Link href="/candidature/deposer" className="btn primary">
                  {homepage?.ctaLabel || 'Déposer une candidature'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="home-call-band" className="section section-band band-calls home-call-band" style={callBandSectionStyle}>
        <div className="container">
          <div className="home-call-band-inner" style={callBandContainerStyle}>
            <div className="home-call-band-eyebrow" style={callBandEyebrowStyle}>Appels à propositions</div>
            {featuredCall ? (
              <article className="home-call-band-featured" style={callBandFeaturedStyle}>
                <div className="home-call-band-featured-left">
                  <span className="home-call-band-status" style={callBandStatusStyle}>
                    <span aria-hidden>●</span>
                    {featuredCallStatus === 'upcoming'
                      ? toUpcomingBadgeLabel(featuredCall.openingDate)
                      : `${toCallStateLabel(featuredCall.callStatus, featuredCall.openingDate, featuredCall.deadlineDate)} • ${
                          featuredCallStatus === 'open' ? 'Appel actif' : 'Appel clôturé'
                        }`}
                  </span>
                  <h3 className="home-call-band-title" style={callBandTitleStyle}>{featuredCall.title || 'Appel à propositions'}</h3>
                  <p className="home-call-band-meta" style={callBandMetaStyle}>Clôture {toDateLabel(featuredCall.deadlineDate)}</p>
                </div>
                <div className="home-call-band-featured-right">
                  {featuredCallCountdown ? (
                    <span className="home-call-band-countdown" style={callBandCountdownStyle}>
                      {featuredCallCountdown}
                    </span>
                  ) : null}
                  {featuredCall.slug ? (
                    <Link href={`/appels/${featuredCall.slug}`} className="btn secondary home-call-band-link">
                      Voir le détail
                    </Link>
                  ) : null}
                </div>
              </article>
            ) : (
              <div className="home-call-band-empty" style={callBandEmptyStyle}>
                <p style={callBandEmptyTitleStyle}>Aucun appel à propositions en cours</p>
                <span style={callBandEmptyIntroStyle}>Consultez les appels précédents ci-dessous ou revenez prochainement.</span>
              </div>
            )}

            {pastCalls.length > 0 ? (
              <details className="home-call-band-history-toggle">
                <summary className="home-call-band-history-summary">
                  Voir les autres appels ({pastCalls.length})
                </summary>
                <div className="home-call-band-history">
                  <div className="home-call-band-history-list" style={callBandHistoryListStyle}>
                    {pastCalls.map((item) => (
                      <article key={item.id} className="home-call-band-history-row" style={callBandHistoryRowStyle}>
                        <div>
                          <h4 className="home-call-band-item-title" style={callBandItemTitleStyle}>{item.title || 'Appel clôturé'}</h4>
                          <p className="home-call-band-meta" style={callBandMetaStyle}>Clôture {toDateLabel(item.deadlineDate)}</p>
                        </div>
                        <div className="home-call-band-history-right" style={callBandHistoryRightStyle}>
                          <span
                            className={`home-call-band-pill ${resolveCallStatus(item.callStatus, item.openingDate, item.deadlineDate)}`}
                            style={{
                              ...callBandPillBaseStyle,
                              ...(resolveCallStatus(item.callStatus, item.openingDate, item.deadlineDate) === 'open'
                                ? callBandPillOpenStyle
                                : callBandPillClosedStyle),
                            }}
                          >
                            {toCallStateLabel(item.callStatus, item.openingDate, item.deadlineDate)}
                          </span>
                          {item.slug ? (
                            <Link href={`/appels/${item.slug}`}>Voir le détail →</Link>
                          ) : (
                            <span className="home-call-band-closed" style={callBandClosedStyle}>
                              Clôturé
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </section>

      <HomeMechanismBand />

      <section id="home-value-chains" className="section section-band band-chains">
        <div className="container">
          <h2 className="section-title">5 chaînes de valeur prioritaires + 1 possibilité transversale</h2>
          <p className="hero-vision infrastructure-lead chain-intro">Les cinq chaînes ciblées par le mécanisme de subventions de contrepartie, plus une possibilité de projet transversal utile à plusieurs chaînes.</p>
          <div className="grid three">
            {homepageChains.map((item) => (
              <article key={item.id} className="card">
                {mediaUrl(item.heroImage) ? (
                  <img
                    className={item.slug === 'projet-transversal' ? 'chain-thumb chain-thumb-diagram' : 'chain-thumb'}
                    src={mediaUrl(item.heroImage)!}
                    alt={item.name || 'Chaîne de valeur'}
                  />
                ) : (
                  <div className="chain-thumb chain-fallback">Photo à ajouter</div>
                )}
                <span className="badge open chain-badge">{item.slug === 'projet-transversal' ? 'Multi-chaînes' : item.name || 'Chaîne de valeur'}</span>
                <p style={{ marginTop: '0.5rem' }}>{item.shortIntro || 'Présentation en cours de publication.'}</p>
                {item.slug ? (
                  <p className="meta">
                    <Link href={`/chaines-valeur/${item.slug}`}>{item.slug === 'projet-transversal' ? 'Comprendre la possibilité' : 'Découvrir la chaîne'}</Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="home-infrastructure-band" className="section infrastructure-band home-infra-band" style={infraSectionStyle}>
        <div className="container infrastructure-wrap home-infra-wrap" style={infraWrapStyle}>
          <div className="infrastructure-copy">
            <h2 className="section-title">Exemples d&apos;infrastructures éligibles</h2>
            <p className="hero-vision infrastructure-lead">
              Physique ou immatérielle : ce qui compte d&apos;abord est le bénéfice collectif pour plusieurs MPME, dans une chaîne prioritaire ou dans un projet transversal.
            </p>
          </div>

          <ul className="infrastructure-list home-infra-list" style={infraListStyle}>
            {infrastructureHighlights.map((item) => (
              <li
                key={item.title}
                className={`infrastructure-item home-infra-item ${item.open ? 'is-open' : ''}`}
                style={item.open ? { ...infraItemStyle, ...infraOpenItemStyle } : infraItemStyle}
              >
                <span className={`infrastructure-icon home-infra-icon ${item.icon}`} aria-hidden="true" style={infraIconStyle}>
                  <InfrastructureIcon kind={item.icon} />
                </span>
                <div className="infrastructure-content home-infra-content">
                  <h3 style={infraItemTitleStyle}>{item.title}</h3>
                  <p style={infraItemTextStyle}>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-band band-partners">
        <div className="container">
          <h2 className="section-title">Nos partenaires</h2>
          <div className="partners-strip" aria-label="Partenaires PRETE SUBCO">
            {partners.map((item) => {
              const logo = mediaUrl(item.logo);
              const content = logo ? (
                <img src={logo} alt={item.name || 'Partenaire'} />
              ) : (
                <span>{item.name || 'Partenaire'}</span>
              );

              return item.websiteUrl ? (
                <a key={item.id} className="partner-logo" href={item.websiteUrl} target="_blank" rel="noreferrer">
                  {content}
                </a>
              ) : (
                <div key={item.id} className="partner-logo">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-wrap">
          <div>
            <p className="eyebrow">Parcours candidat</p>
            <h3>Préparez votre dossier et soumettez-le en ligne</h3>
          </div>
          <Link href="/candidature" className="btn primary">Commencer la candidature</Link>
        </div>
      </section>

      <section className="section section-band band-events-news">
        <div className="container two-col">
          <div>
            <h2 className="section-title">Événements</h2>
            <p className="meta"><Link href="/evenements">Voir tous les événements</Link></p>
            {events.slice(0, 4).map((item) => (
              <div key={item.id} className="list-item">
                <h3>{item.title}</h3>
                <p>{toDateLabel(item.eventDate)} · {item.location || 'Lieu à confirmer'}</p>
                {item.slug ? <p className="meta"><Link href={`/evenements/${item.slug}`}>Voir le détail</Link></p> : null}
              </div>
            ))}
          </div>

          <div>
            <h2 className="section-title">Actualités</h2>
            <p className="meta"><Link href="/actualites">Voir toutes les actualités</Link></p>
            {news.slice(0, 4).map((item) => (
              <div key={item.id} className="list-item">
                <h3>{item.title}</h3>
                <p>{item.excerpt || 'Contenu à venir.'}</p>
                {item.slug ? <p className="meta"><Link href={`/actualites/${item.slug}`}>Lire l’article</Link></p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band band-stories">
        <div className="container">
          <h2 className="section-title">Résultats attendus</h2>
          <div className="grid three">
            {expectedResults.map((item) => (
              <article key={item.title} className="card result-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band band-faq">
        <div className="container">
          <h2 className="section-title">FAQ</h2>
          <div className="faq-list">
            {faqs.slice(0, 6).map((item) => (
              <details key={item.id} className="faq-item">
                <summary>{item.question || 'Question'}</summary>
                <p>{blocksToText(item.answer) || 'Réponse en cours de publication.'}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
