import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getValueChainBySlug, mediaUrl } from '@/lib/strapi-public';
import { RichText } from '@/components/rich-text';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getValueChainBySlug(slug);
  if (!item) return { title: 'Chaîne introuvable | SUBCO PRETE' };
  return {
    title: `${item.name || 'Chaîne de valeur'} | SUBCO PRETE`,
    description: item.shortIntro || 'Détail de la chaîne de valeur',
  };
}

export default async function ValueChainDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getValueChainBySlug(slug);
  if (!item) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <p className="meta"><Link href="/#home-value-chains">← Retour aux chaînes de valeur</Link></p>
        <h1>{item.name}</h1>
        {mediaUrl(item.heroImage) ? (
          <img className="chain-hero-image" src={mediaUrl(item.heroImage)!} alt={item.name || 'Chaîne de valeur'} />
        ) : null}
        <p>{item.shortIntro || ''}</p>
        {!mediaUrl(item.heroImage) && item.photoHint ? (
          <p className="meta">Photo suggérée: {item.photoHint}</p>
        ) : null}
        <article className="card" style={{ marginTop: 16 }}>
          <RichText value={item.fullContent} />
        </article>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/#home-call-band" className="btn ghost">Voir les appels liés</Link>
          <Link href="/candidature/deposer" className="btn primary">Déposer une candidature</Link>
        </div>
      </div>
    </main>
  );
}
