import Link from 'next/link';
import { getResourceDocuments, mediaUrl } from '@/lib/strapi-public';

export const metadata = {
  title: 'Documents & ressources — SUBCO-PRETE',
  description: 'Formulaires, guides, modèles et documents des appels à propositions du programme SUBCO-PRETE.',
};

const CATEGORY_LABELS: Record<string, string> = {
  appel: 'Documents d’appel',
  formulaire: 'Formulaires',
  guide: 'Guides',
  modele: 'Modèles',
  grille: 'Grilles d’évaluation',
  tdr: 'Termes de référence',
  manuel: 'Manuels',
  note: 'Notes',
  rapport: 'Rapports',
  autre: 'Autres documents',
};

const CATEGORY_ORDER = ['appel', 'formulaire', 'guide', 'modele', 'grille', 'tdr', 'manuel', 'note', 'rapport', 'autre'];

/* Banque d'icônes filaires 24x24 — une famille par catégorie, repli générique.
   Aucun attribut fill/stroke sur les <path> : le style vient du CSS des pastilles. */
function CategoryIcon({ name }: { name: string }) {
  switch (name) {
    case 'appel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11v2a1 1 0 0 0 1 1h2l9 4V6L6 10H4a1 1 0 0 0-1 1Z" />
          <path d="M18 8a4 4 0 0 1 0 8" />
          <path d="M7 14v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
        </svg>
      );
    case 'formulaire':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="m8 13 1.3 1.3L11.5 12" />
          <path d="M13.5 13.3H16" />
        </svg>
      );
    case 'guide':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5" />
          <path d="M12 6.5C13.5 5 16 4.5 20 5v13c-4-.5-6.5 0-8 1.5" />
          <path d="M12 6.5v13" />
        </svg>
      );
    case 'modele':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );
    case 'grille':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 10h16" />
          <path d="M4 15h16" />
          <path d="M10 4v16" />
          <path d="M15 4v16" />
        </svg>
      );
    case 'tdr':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="5" width="14" height="16" rx="2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case 'manuel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" />
          <path d="M5 17h13" />
          <path d="M9 8h6" />
        </svg>
      );
    case 'note':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v10l-5 5H5V4Z" />
          <path d="M19 14h-5v5" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
        </svg>
      );
    case 'rapport':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 16v-3" />
          <path d="M12 16v-6" />
          <path d="M16 16v-4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" />
          <path d="M13 3v6h6" />
        </svg>
      );
  }
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M13 3v6h6" />
      <path d="M9 13h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default async function ResourcesPage() {
  const documents = await getResourceDocuments();

  const byCategory = new Map<string, typeof documents>();
  for (const doc of documents) {
    const cat = doc.category || 'autre';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(doc);
  }
  const categories = CATEGORY_ORDER.filter((cat) => byCategory.has(cat));

  return (
    <main>
      <section className="section section-band" style={{ backgroundColor: '#ffffff' }}>
        <div className="container">
          <p className="eyebrow candidature-bis-eyebrow">Centre de ressources</p>
          <h1 className="page-title">Documents &amp; ressources</h1>
          <p className="hero-vision" style={{ maxWidth: '62ch' }}>
            Formulaires, guides, modèles et documents des appels à propositions — à consulter avant de préparer votre
            candidature.
          </p>
          <div className="docs-hero-meta">
            <span>Formulaires · Guides · Modèles</span>
            <span>Documents d’appel à propositions</span>
            <span>Téléchargement libre</span>
          </div>
        </div>
      </section>

      <section className="section docs-band">
        <div className="container">
          {documents.length === 0 ? (
            <div className="docs-empty">
              <span className="docs-empty-icon">
                <CategoryIcon name="autre" />
              </span>
              <h2>Aucun document publié pour le moment</h2>
              <p>Les documents seront publiés ici prochainement.</p>
              <div className="docs-empty-actions">
                <Link className="btn primary" href="/appels">
                  Voir les appels à propositions
                </Link>
                <Link className="btn secondary" href="/faq">
                  Consulter la FAQ
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="docs-band-head">
                <h2>Tous les documents utiles au programme</h2>
                <p>
                  Regroupés par type. Consultez un document en ligne ou téléchargez-le — l’accès est libre et ne
                  nécessite pas de compte.
                </p>
              </div>

              <div className="docs-groups">
                {categories.map((cat) => {
                  const docs = byCategory.get(cat)!;
                  return (
                    <section key={cat} className="docs-group">
                      <div className="docs-group-head">
                        <span className="docs-icon">
                          <CategoryIcon name={cat} />
                        </span>
                        <h3 className="docs-group-title">{CATEGORY_LABELS[cat] || cat}</h3>
                        <span className="docs-group-count">
                          {docs.length} document{docs.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="docs-list">
                        {docs.map((doc, index) => {
                          const url = mediaUrl(doc.file);
                          const title = doc.title || 'Document';
                          if (url) {
                            return (
                              <div key={doc.id ?? `${cat}-${index}`} className="docs-item">
                                <span className="docs-file-icon">
                                  <FileIcon />
                                </span>
                                <span className="docs-item-body">
                                  <span className="docs-item-title">{title}</span>
                                  {doc.description ? <span className="docs-item-desc">{doc.description}</span> : null}
                                </span>
                                <span className="docs-item-actions">
                                  <a
                                    className="docs-action docs-action-view"
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Consulter : ${title}`}
                                    title="Consulter"
                                  >
                                    <ViewIcon />
                                  </a>
                                  {doc.documentId ? (
                                    <a
                                      className="docs-action docs-action-dl"
                                      href={`/ressources/telecharger/${doc.documentId}`}
                                      aria-label={`Télécharger : ${title}`}
                                      title="Télécharger"
                                    >
                                      <DownloadIcon />
                                    </a>
                                  ) : null}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div key={doc.id ?? `${cat}-${index}`} className="docs-item is-missing">
                              <span className="docs-file-icon">
                                <FileIcon />
                              </span>
                              <span className="docs-item-body">
                                <span className="docs-item-title">{title}</span>
                                {doc.description ? <span className="docs-item-desc">{doc.description}</span> : null}
                              </span>
                              <span className="docs-item-flag">Indisponible</span>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
