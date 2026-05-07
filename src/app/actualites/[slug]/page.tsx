import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug } from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';

type Props = { params: Promise<{ slug: string }> };

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <p className="meta"><Link href="/">← Retour à l’accueil</Link></p>
        <h1>{item.title}</h1>
        <p className="meta">{item.publishedAtCustom || ''}</p>
        <p>{item.excerpt || ''}</p>
        <article className="card" style={{ marginTop: 16 }}>
          <p style={{ whiteSpace: 'pre-line' }}>{blocksToText(item.content) || 'Article en cours de publication.'}</p>
        </article>
      </div>
    </main>
  );
}
