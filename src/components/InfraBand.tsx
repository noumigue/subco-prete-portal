import Link from 'next/link';
import { getInfrastructureBand, getInfrastructureTypes } from '@/lib/strapi-public';
import { InfraIcon } from '@/components/infra-icon';

export default async function InfraBand() {
  const [items, band] = await Promise.all([
    getInfrastructureTypes(),
    getInfrastructureBand(),
  ]);

  if (!items.length) return null;

  return (
    <section id="home-infrastructure-band" className="section infrastructure-band home-infra-band">
      <div className="container infrastructure-wrap home-infra-wrap">
        <div className="infrastructure-copy">
          <h2 className="section-title">{band?.title || "Exemples d'infrastructures éligibles"}</h2>
          {band?.intro ? (
            <p className="hero-vision infrastructure-lead">{band.intro}</p>
          ) : null}
        </div>

        <div className="infrastructure-list infra-card-grid">
          {items.map((item) => (
            <Link
              key={item.slug || item.id}
              href={item.slug ? `/infrastructures/${item.slug}` : '/#home-infrastructure-band'}
              className={`infrastructure-item infrastructure-card-link ${item.highlight ? 'is-open is-highlight' : ''}`}
            >
              <span className={`infrastructure-icon ${item.icon || ''}`} aria-hidden="true">
                <InfraIcon name={item.icon} />
              </span>
              <div className="infrastructure-content">
                <h3>{item.title}</h3>
                <p>{item.cardText}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
