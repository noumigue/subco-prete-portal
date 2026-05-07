import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getEventBySlug(slug);
  if (!item) return { title: 'Événement introuvable | SUBCO PRETE' };
  return {
    title: `${item.title || 'Événement'} | SUBCO PRETE`,
    description: `Détail événement - ${item.location || 'Lieu à confirmer'}`,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getEventBySlug(slug);
  if (!item) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <p className="meta"><Link href="/">← Retour à l’accueil</Link></p>
        <h1>{item.title}</h1>
        <p className="meta">Date: {item.eventDate || 'N/A'} · Lieu: {item.location || 'N/A'}</p>
        <article className="card" style={{ marginTop: 16 }}>
          <p style={{ whiteSpace: 'pre-line' }}>{blocksToText(item.description) || 'Description en cours de publication.'}</p>
        </article>
      </div>
    </main>
  );
}
