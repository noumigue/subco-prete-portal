import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCallBySlug } from '@/lib/strapi-public';
import { blocksToText } from '@/lib/richtext';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCallBySlug(slug);
  if (!item) return { title: 'Appel introuvable | SUBCO PRETE' };
  return {
    title: `${item.title || 'Appel'} | SUBCO PRETE`,
    description: item.summary || 'Détail de l’appel à propositions',
  };
}

export default async function CallDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getCallBySlug(slug);
  if (!item) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <p className="meta"><Link href="/#appels">← Retour aux appels</Link></p>
        <h1>{item.title}</h1>
        <p className="meta">Statut: {item.callStatus || 'draft'}</p>
        <p className="meta">Ouverture: {item.openingDate || 'N/A'} · Clôture: {item.deadlineDate || 'N/A'}</p>
        <p>{item.summary || ''}</p>
        <article className="card" style={{ marginTop: 16 }}>
          <p style={{ whiteSpace: 'pre-line' }}>{blocksToText(item.content) || 'Contenu en cours de publication.'}</p>
        </article>
      </div>
    </main>
  );
}
