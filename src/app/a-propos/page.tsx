import Link from 'next/link';
import { getAboutPage } from '@/lib/strapi-public';

const fallbackSections = [
  {
    title: 'Le projet PRETE / NYUNGANIRA',
    text: 'PRETE accompagne la transformation productive locale en ciblant des investissements capables de renforcer les chaînes de valeur prioritaires.',
  },
  {
    title: 'Le mécanisme SUBCO',
    text: 'SUBCO organise l’information, la préparation, la soumission et le suivi des demandes de subventions de contrepartie.',
  },
  {
    title: 'Objectifs du dispositif',
    text: 'Le dispositif vise des projets structurants, viables et utiles aux MPME, avec un accent sur l’emploi, l’inclusion et la compétitivité.',
  },
  {
    title: 'Infrastructures productives',
    text: 'Les infrastructures productives peuvent être matérielles ou immatérielles : équipements, services, systèmes qualité, logistique, traçabilité ou appuis techniques.',
  },
  {
    title: 'Partenaires institutionnels',
    text: 'La plateforme présente les partenaires impliqués dans le pilotage, l’accompagnement et la mise en œuvre du mécanisme.',
  },
];

export default async function AboutPage() {
  const aboutPage = await getAboutPage();
  const sections = aboutPage?.sections?.length ? aboutPage.sections : fallbackSections;

  return (
    <main className="section">
      <div className="container page-intro">
        <p className="form-kicker">{aboutPage?.kicker || 'À propos'}</p>
        <h1>{aboutPage?.title || 'Comprendre PRETE SUBCO'}</h1>
        <p>
          {aboutPage?.intro ||
            'Cette section rassemble les éléments essentiels pour situer le projet, le mécanisme de subvention et les investissements productifs ciblés.'}
        </p>
      </div>

      <section className="section section-band band-chains">
        <div className="container">
          <div className="grid two about-grid">
            {sections.map((section) => (
              <article key={section.title} className="info-panel">
                <h2>{section.title || 'Section'}</h2>
                <p>{section.text || 'Contenu en cours de publication.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band-wrap">
          <div>
            <p className="eyebrow">Parcours candidat</p>
            <h3>Consultez les chaînes de valeur ou préparez votre dossier</h3>
          </div>
          <div className="actions compact">
            <Link href="/chaines-valeur" className="btn ghost">Chaînes de valeur</Link>
            <Link href="/candidature/deposer" className="btn primary">Candidater</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
