import Link from 'next/link';
import {
  getCalls,
  getEvents,
  getFaqs,
  getHomepage,
  getNews,
  getSuccessStories,
  getValueChains,
  mediaUrl,
} from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

export default async function HomePage() {
  const [homepage, chains, calls, events, news, stories, faqs] = await Promise.all([
    getHomepage(),
    getValueChains(),
    getCalls(),
    getEvents(),
    getNews(),
    getSuccessStories(),
    getFaqs(),
  ]);
  const heroImage = mediaUrl(homepage?.heroImage) || mediaUrl(chains.find((item) => mediaUrl(item.heroImage))?.heroImage);

  return (
    <main className="min-h-screen">
      <section
        className="hero hero-template"
        style={
          heroImage
            ? ({
                ['--hero-photo' as any]: `url(${heroImage})`,
              } as any)
            : undefined
        }
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
                <Link href="/candidature" className="btn primary">
                  {homepage?.ctaLabel || 'Déposer une candidature'}
                </Link>
                <Link href="/chaines-valeur" className="btn ghost">En savoir plus</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-band band-chains">
        <div className="container">
          <h2 className="section-title">5 chaînes de valeur prioritaires</h2>
          <p className="meta"><Link href="/chaines-valeur">Voir le détail des chaînes</Link></p>
          <div className="grid three">
            {chains.slice(0, 5).map((item) => (
              <article key={item.id} className="card">
                {mediaUrl(item.heroImage) ? (
                  <img className="chain-thumb" src={mediaUrl(item.heroImage)!} alt={item.name || 'Chaîne de valeur'} />
                ) : (
                  <div className="chain-thumb chain-fallback">Photo à ajouter</div>
                )}
                <span className="badge open chain-badge">{item.name || 'Chaîne de valeur'}</span>
                <p>{item.shortIntro || 'Présentation en cours de publication.'}</p>
                {item.slug ? (
                  <p className="meta">
                    <Link href={`/chaines-valeur/${item.slug}`}>Découvrir la chaîne</Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="appels" className="section section-band band-calls">
        <div className="container">
          <h2 className="section-title">Appels à propositions</h2>
          <p className="meta"><Link href="/appels">Voir tous les appels</Link></p>
          <div className="grid three">
            {calls.slice(0, 3).map((item) => (
              <article key={item.id} className="card">
                <span className={`badge ${item.callStatus || 'draft'}`}>{item.callStatus || 'draft'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || 'Résumé en cours de publication.'}</p>
                <p className="meta">Clôture: {toDateLabel(item.deadlineDate)}</p>
                {item.slug ? (
                  <p className="meta">
                    <Link href={`/appels/${item.slug}`}>Voir le détail</Link>
                  </p>
                ) : null}
              </article>
            ))}
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
          <h2 className="section-title">Opérateurs financés - expériences à succès</h2>
          <div className="grid three">
            {stories.slice(0, 3).map((item) => (
              <article key={item.id} className="card">
                <h3>{item.title}</h3>
                <p className="meta">{item.operatorName || 'Opérateur PRETE'}</p>
                <p>{item.summary || 'Fiche en cours de rédaction.'}</p>
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
