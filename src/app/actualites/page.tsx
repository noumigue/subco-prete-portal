import Link from 'next/link';
import { getNews } from '@/lib/strapi-public';

export default async function NewsListPage() {
  const news = await getNews();

  return (
    <main className="section">
      <div className="container">
        <h1>Actualités</h1>
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
