import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCallBySlug } from '@/lib/strapi-public';
import { RichText } from '@/components/rich-text';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

function formatDate(value?: string) {
  if (!value) return 'Date à confirmer';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

function resolveCallState(openingDate?: string, deadlineDate?: string, rawStatus?: string) {
  const now = new Date();
  const opening = openingDate ? new Date(openingDate) : null;
  const deadline = deadlineDate ? new Date(deadlineDate) : null;

  if (deadline && !Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime()) return 'Clôturé';
  if (opening && !Number.isNaN(opening.getTime()) && opening.getTime() > now.getTime()) return 'À venir';
  if ((rawStatus || '').toLowerCase() === 'closed') return 'Clôturé';
  return 'Ouvert';
}

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
        <p className="meta">Statut : {resolveCallState(item.openingDate, item.deadlineDate, item.callStatus)}</p>
        <p className="meta">Ouverture : {formatDate(item.openingDate)} · Clôture : {formatDate(item.deadlineDate)}</p>
        <p>{item.summary || ''}</p>
        <article className="card" style={{ marginTop: 16 }}>
          <RichText value={item.content} />
        </article>
      </div>
    </main>
  );
}
