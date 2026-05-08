import Link from 'next/link';
import { getNews, getNewsByCategory, type NewsItem } from '@/lib/strapi-public';

const categoryLabels: Record<NonNullable<NewsItem['category']>, string> = {
  actualite: 'Actualités',
  communique: 'Communiqués',
  annonce_resultat: 'Annonces / résultats',
};

export default async function NewsListPage({
  searchParams,
}: {
  searchParams?: Promise<{ categorie?: string }>;
}) {
  const params = await searchParams;
  const category = params?.categorie as NewsItem['category'] | undefined;
  const isKnownCategory = category === 'actualite' || category === 'communique' || category === 'annonce_resultat';
  const news = isKnownCategory ? await getNewsByCategory(category) : await getNews();
  const title = isKnownCategory ? categoryLabels[category] : 'Actualités';

  return (
    <main className="section">
      <div className="container">
        <h1>{title}</h1>
        <div className="grid three" style={{ marginTop: 16 }}>
          {news.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.title}</h3>
              <p>{item.excerpt || 'Contenu en cours de publication.'}</p>
              {item.slug ? <p className="meta"><Link href={`/actualites/${item.slug}`}>Lire l’article</Link></p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
