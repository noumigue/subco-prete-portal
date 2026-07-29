import Link from 'next/link';
import type { CSSProperties } from 'react';
import InfraBand from '@/components/InfraBand';
import FaqSection from './FaqSection';
import HomeMechanismBand from './HomeMechanismBand';
import HomeNotificationBand from './HomeNotificationBand';
import HomeOpeningModal from './HomeOpeningModal';
import HomeProgramStepsBand from './HomeProgramStepsBand';
import {
  getHomeAppels,
  getFaqItems,
  getHomepage,
  getPartners,
  getProgramSteps,
  getValueChains,
  mediaUrl,
} from '@/lib/strapi-public';

type HeroStyle = CSSProperties & {
  '--hero-photo'?: string;
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

function cohortRank(value?: string) {
  const match = String(value || '').match(/cohorte-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function resolveNotificationTargetCohort(programSteps: Awaited<ReturnType<typeof getProgramSteps>>) {
  const cohorts = [...new Set(programSteps.map((item) => item.cohort).filter(Boolean))]
    .sort((a, b) => cohortRank(a) - cohortRank(b));

  const fullyUpcoming = cohorts.find((cohort) =>
    programSteps.filter((item) => item.cohort === cohort).every((item) => item.status === 'a-venir')
  );

  if (fullyUpcoming) return fullyUpcoming;

  const activeCohort = programSteps.find((item) => item.status === 'en-cours')?.cohort;
  if (!activeCohort) return cohorts[0] || null;

  return cohorts.find((cohort) => cohortRank(cohort) > cohortRank(activeCohort)) || activeCohort;
}

export default async function HomePage() {
  const [homepage, chains, calls, partners, faqItems, programSteps] = await Promise.all([
    getHomepage(),
    getValueChains(),
    getHomeAppels(),
    getPartners(),
    getFaqItems(),
    getProgramSteps(),
  ]);
  const transversalChain = chains.find((item) => item.slug === 'projet-transversal');
  // Toutes les chaînes prioritaires (non transversales), triées par priorityOrder, puis la transversale.
  // Plus de plafond codé en dur : une nouvelle chaîne (ex. porcine) apparaît automatiquement.
  const priorityChains = chains.filter((item) => item.slug !== 'projet-transversal');
  const priorityCount = priorityChains.length;
  const homepageChains = [
    ...priorityChains,
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
  const hasOpenCall = orderedCalls.some((item) => resolveCallStatus(item.callStatus, item.openingDate, item.deadlineDate) === 'open');
  const notificationTargetCohort = resolveNotificationTargetCohort(programSteps);
  // Vignette d'accueil (overlay additif) : uniquement quand aucun appel n'est ouvert et
  // qu'une ouverture future est connue (ex. C1 le 20 août) → compte à rebours J-XX.
  const openingModalDate = !hasOpenCall && featuredCallStatus === 'upcoming' ? featuredCall?.openingDate : undefined;

  return (
    <main className="min-h-screen">
      {openingModalDate ? <HomeOpeningModal openingDate={openingModalDate} /> : null}
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
                <Link href="/candidature" className="btn primary">
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
                  <Link href="/candidature" className="btn secondary home-call-band-link">
                    Voir le détail
                  </Link>
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
          <h2 className="section-title">{priorityCount} chaînes de valeur prioritaires + 1 possibilité transversale</h2>
          <p className="hero-vision infrastructure-lead chain-intro">Les chaînes ciblées par le mécanisme de subventions de contrepartie, plus une possibilité de projet transversal utile à plusieurs chaînes.</p>
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

      <InfraBand />

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

      <HomeProgramStepsBand steps={programSteps} />
      <HomeNotificationBand disabled={hasOpenCall} targetCohort={notificationTargetCohort} />

      <section id="home-faq" className="section section-band band-faq">
        <div className="container">
          <FaqSection items={faqItems} compact />
        </div>
      </section>
    </main>
  );
}
