import Link from 'next/link';
import type { CSSProperties } from 'react';
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

const infrastructureHighlights = [
  {
    title: 'Production et transformation',
    text: 'Unités de production, transformation agroalimentaire ou minière, ateliers mutualisés.',
    icon: 'factory',
    glyph: '🏭',
  },
  {
    title: 'Stockage et conservation',
    text: 'Entrepôts, chambres froides, silos, centres de collecte et solutions de conservation partagée.',
    icon: 'warehouse',
    glyph: '🏬',
  },
  {
    title: 'Logistique et commercialisation',
    text: 'Plateformes logistiques, marchés, transport adapté, agrégation et mise en marché.',
    icon: 'truck',
    glyph: '🚚',
  },
  {
    title: 'Qualité et certification',
    text: 'Laboratoires, contrôle qualité, inspection, traçabilité et mise en conformité.',
    icon: 'badge',
    glyph: '✅',
  },
  {
    title: 'Numérique et e-commerce',
    text: 'Plateformes digitales, systèmes de gestion et e-commerce au service des MPME.',
    icon: 'cloud',
    glyph: '💻',
  },
  {
    title: 'Formation et conseil',
    text: 'Formation, mentorat, assistance technique et accompagnement liés au projet.',
    icon: 'training',
    glyph: '🎓',
  },
  {
    title: 'Infrastructure immatérielle',
    text: 'Eligible si l’usage est collectif et utile aux MPME, sous validation du programme.',
    icon: 'connect',
    glyph: '🗂️',
  },
  {
    title: 'Et bien d’autres...',
    text: 'Toute infrastructure à usage collectif ou partagé, sous validation du programme.',
    open: true,
    icon: 'more',
    glyph: '➕',
  },
];

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
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

  return (
    <main className="min-h-screen">
      <section
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

      <section className="section section-band band-chains">
        <div className="container">
          <h2 className="section-title">5 chaînes de valeur prioritaires + 1 possibilité transversale</h2>
          <p className="meta">Les cinq chaînes ciblées par le mécanisme de subventions de contrepartie, plus une possibilité de projet transversal utile à plusieurs chaînes.</p>
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
                <p
                  className="chain-intro"
                  style={{ marginTop: '0.5rem' }}
                >
                  {item.shortIntro || 'Présentation en cours de publication.'}
                </p>
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

      <section className="section infrastructure-band">
        <div className="container infrastructure-wrap">
          <div className="infrastructure-copy">
            <h2 className="section-title">Exemples d&apos;infrastructures éligibles</h2>
            <p className="hero-vision infrastructure-lead">
              Physique ou immatérielle : ce qui compte d&apos;abord est le bénéfice collectif pour plusieurs MPME, dans une chaîne prioritaire ou dans un projet transversal.
            </p>
          </div>

          <ul className="infrastructure-list">
            {infrastructureHighlights.map((item) => (
              <li key={item.title} className={`infrastructure-item ${item.open ? 'is-open' : ''}`}>
                <span className={`infrastructure-icon ${item.icon}`} aria-hidden="true">{item.glyph}</span>
                <div className="infrastructure-content">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="appels" className="section section-band band-calls">
        <div className="container">
          <h2 className="section-title">Appels à propositions</h2>
          <p className="meta"><Link href="/appels">Voir tous les appels</Link></p>
          <div className="grid three">
            {calls.slice(0, 3).map((item) => (
              <article key={item.id} className="card call-card">
                <div className="call-card-top">
                  <span className={`badge ${item.callStatus || 'draft'}`}>{item.callStatus || 'draft'}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="call-summary">{item.summary || 'Résumé en cours de publication.'}</p>
                <div className="call-deadline">
                  <span>Clôture</span>
                  <strong>{toDateLabel(item.deadlineDate)}</strong>
                </div>
                {item.slug ? (
                  <p className="call-action">
                    <Link href={`/appels/${item.slug}`}>Voir le détail</Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
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
          <Link href="/candidature/deposer" className="btn primary">Commencer la candidature</Link>
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
