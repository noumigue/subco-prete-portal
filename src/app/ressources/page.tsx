import Link from 'next/link';
import { getResourceDocuments, mediaUrl } from '@/lib/strapi-public';

const categoryLabels = {
  appel: 'Appel',
  tdr: 'TDR',
  formulaire: 'Formulaire',
  modele: 'Modèle',
  guide: 'Guide',
  grille: 'Grille',
  manuel: 'Manuel',
  note: 'Note',
  rapport: 'Rapport',
  autre: 'Document',
} as const;

const fallbackResources = [
  {
    title: "Avis d'appel à projets",
    category: 'tdr',
    description: 'Consultez les appels ouverts, les dates clés et les informations officielles liées aux soumissions.',
    url: '/appels',
  },
  {
    title: 'Préparer une candidature',
    category: 'guide',
    description: 'Retrouvez les repères essentiels pour comprendre le parcours candidat et préparer les informations attendues.',
    url: '/candidature',
  },
  {
    title: 'Formulaire de dépôt en ligne',
    category: 'formulaire',
    description: 'Accédez au formulaire numérique pour transmettre une demande de subvention et les pièces justificatives.',
    url: '/candidature/deposer',
  },
] as const;

export default async function ResourcesPage() {
  const resources = await getResourceDocuments();

  return (
    <main className="section">
      <div className="container page-intro">
        <p className="form-kicker">Ressources</p>
        <h1>Documents et références utiles</h1>
        <p>
          Retrouvez les documents officiels, guides, formulaires et informations pratiques liés au mécanisme SUBCO PRETE.
        </p>
      </div>

      <section className="section section-band band-chains">
        <div className="container">
          <div className="grid three">
            {resources.length ? (
              resources.map((item) => {
                const fileUrl = mediaUrl(item.file);
                const category = item.category || 'autre';

                return (
                  <article key={item.id} className="card resource-card">
                    <span className="badge open">{categoryLabels[category]}</span>
                    <h3>{item.title || 'Document'}</h3>
                    <p>{item.description || 'Description en cours de publication.'}</p>
                    {fileUrl ? (
                      <p className="meta">
                        <a href={fileUrl} target="_blank" rel="noreferrer">Ouvrir le document</a>
                      </p>
                    ) : null}
                  </article>
                );
              })
            ) : (
              fallbackResources.map((item) => (
                <article key={item.title} className="card resource-card">
                  <span className="badge open">{categoryLabels[item.category]}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p className="meta">
                    <Link href={item.url}>Consulter</Link>
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
