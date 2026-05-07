import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug } from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) return { title: 'Actualité introuvable | SUBCO PRETE' };
  return {
    title: `${item.title || 'Actualité'} | SUBCO PRETE`,
    description: item.excerpt || 'Article actualité du programme',
  };
}

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
