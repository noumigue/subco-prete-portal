import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { InfraRichText } from '@/components/infra-rich-text';
import { getInfrastructureBySlug, getInfrastructureTypes } from '@/lib/strapi-public';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInfrastructureBySlug(slug);
  if (!item) return { title: 'Infrastructure introuvable | SUBCO PRETE' };
  return {
    title: `${item.title || 'Infrastructure'} | SUBCO PRETE`,
    description: item.lead || item.cardText || "Détail d'un type d'infrastructure",
  };
}

export default async function InfrastructureDetailPage({ params }: Props) {
  const { slug } = await params;
  const [item, items] = await Promise.all([
    getInfrastructureBySlug(slug),
    getInfrastructureTypes(),
  ]);

  if (!item) notFound();

  return (
    <main className="section">
      <div className="container infra-article-wrap">
        <article className="infra-article">
          <h1>{item.title}</h1>
          {item.lead ? <p className="lead">{item.lead}</p> : null}

          <InfraRichText value={item.body} immaterial={item.nature !== 'physique'} />

          <div className="infra-cta">
            <div>
              <h3>Ce type correspond à votre projet ?</h3>
              <p>Vérifiez votre éligibilité, puis préparez votre candidature.</p>
            </div>
            <div className="btns">
              <Link className="btn primary" href="/eligibilite">Tester mon éligibilité</Link>
              <Link className="btn ghost" href="/candidature">Candidater</Link>
            </div>
          </div>

          <nav className="infra-others" aria-label="Autres types d'infrastructure">
            <div className="eyebrow">Autres types d&apos;infrastructure</div>
            <ol>
              {items.map((other) =>
                other.slug === item.slug ? (
                  <li key={other.slug || other.id} className="active">
                    <span className="self">{other.title}</span>
                  </li>
                ) : (
                  <li key={other.slug || other.id}>
                    <Link href={`/infrastructures/${other.slug}`}>{other.title}</Link>
                  </li>
                ),
              )}
            </ol>
          </nav>
        </article>
      </div>
    </main>
  );
}
