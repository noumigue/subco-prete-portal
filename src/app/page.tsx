import Link from 'next/link';
import {
  getCalls,
  getEvents,
  getFaqs,
  getHomepage,
  getNews,
  getSuccessStories,
} from '@/lib/strapi-public';

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

function nodeToText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node?.text === 'string') return node.text;
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (Array.isArray(node?.children)) return node.children.map(nodeToText).join('');
  return '';
}

function blocksToText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return nodeToText(value);

  return value
    .map((block) => nodeToText(block))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export default async function HomePage() {
  const [homepage, calls, events, news, stories, faqs] = await Promise.all([
    getHomepage(),
    getCalls(),
    getEvents(),
    getNews(),
    getSuccessStories(),
    getFaqs(),
  ]);

  return (
    <main className="min-h-screen">
      <section className="hero">
        <div className="container">
          <p className="eyebrow">SUBCO PRETE</p>
          <h1>{homepage?.heroTitle || 'Plateforme de subventions de contrepartie'}</h1>
          <p>{homepage?.heroSubtitle || 'Information, appels à candidatures, et suivi des opérateurs.'}</p>
          <div className="actions">
            <Link href="/candidature" className="btn primary">
              {homepage?.ctaLabel || 'Déposer une candidature'}
            </Link>
            <a href="#appels" className="btn ghost">Voir les appels</a>
          </div>
        </div>
      </section>

      <section id="appels" className="section">
        <div className="container">
          <h2>Appels à propositions</h2>
          <div className="grid three">
            {calls.slice(0, 3).map((item) => (
              <article key={item.id} className="card">
                <span className={`badge ${item.callStatus || 'draft'}`}>{item.callStatus || 'draft'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || 'Résumé en cours de publication.'}</p>
                <p className="meta">Clôture: {toDateLabel(item.deadlineDate)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container two-col">
          <div>
            <h2>Événements</h2>
            {events.slice(0, 4).map((item) => (
              <div key={item.id} className="list-item">
                <h3>{item.title}</h3>
                <p>{toDateLabel(item.eventDate)} · {item.location || 'Lieu à confirmer'}</p>
              </div>
            ))}
          </div>

          <div>
            <h2>Actualités</h2>
            {news.slice(0, 4).map((item) => (
              <div key={item.id} className="list-item">
                <h3>{item.title}</h3>
                <p>{item.excerpt || 'Contenu à venir.'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Opérateurs financés - expériences à succès</h2>
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

      <section className="section alt">
        <div className="container">
          <h2>FAQ</h2>
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
