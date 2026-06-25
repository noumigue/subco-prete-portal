import Link from 'next/link';
import { getValueChains, mediaUrl } from '@/lib/strapi-public';

export default async function ValueChainsPage() {
  const chains = await getValueChains();

  return (
    <main className="section">
      <div className="container">
        <h1>Chaînes de valeur prioritaires PRETE</h1>
        <p className="meta">Les cinq chaînes ciblées par le mécanisme de subventions de contrepartie, plus une possibilité de projet transversal utile à plusieurs chaînes.</p>
        <div className="grid three" style={{ marginTop: 16 }}>
          {chains.map((item) => (
            <article key={item.id} className="card">
              {mediaUrl(item.heroImage) ? (
                <img
                  className={item.slug === 'projet-transversal' ? 'chain-thumb chain-thumb-diagram' : 'chain-thumb'}
                  src={mediaUrl(item.heroImage)!}
                  alt={item.name || 'Chaîne de valeur'}
                />
              ) : (
                <div className="chain-thumb chain-fallback">Photo à ajouter</div>
              )}
              <span className="badge open chain-badge">{item.slug === 'projet-transversal' ? 'Multi-chaînes' : item.name || 'Chaîne de valeur'}</span>
              <h3>{item.name}</h3>
              <p>{item.shortIntro || 'Contenu en cours de publication.'}</p>
              {item.slug ? <p className="meta"><Link href={`/chaines-valeur/${item.slug}`}>{item.slug === 'projet-transversal' ? 'Comprendre la possibilité' : 'Voir le détail'}</Link></p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
