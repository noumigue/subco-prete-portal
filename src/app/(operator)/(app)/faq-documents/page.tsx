import {
  getPortalFaqItems,
  getPortalResourceDocuments,
  getPortalTypePieces,
} from '@/lib/portal-api';
import { portalMediaUrl } from '@/lib/portal-media';
import type { PortalBlockLike } from '@/lib/portal-blocks';
import { blocksToText } from '@/lib/portal-blocks';

const GROUP_LABELS: Record<string, string> = {
  administratif: 'Administratives',
  financier: 'Financières',
  technique: 'Techniques',
};

const EXIGENCE_LABELS: Record<string, string> = {
  obligatoire: 'Obligatoire',
  si_applicable: 'Si applicable',
  si_disponible: 'Si disponible',
};

export default async function FaqDocumentsPage() {
  // FAQ et documents = contenu editorial REEL deja gere au CMS (faq-item + resource-document,
  // partages avec le site public). Pieces = referentiel type-piece (Annexe 9).
  const [faq, documents, typePieces] = await Promise.all([
    getPortalFaqItems(),
    getPortalResourceDocuments(),
    getPortalTypePieces(),
  ]);

  const groups = ['administratif', 'financier', 'technique'].map((group) => ({
    key: group,
    label: GROUP_LABELS[group],
    items: typePieces.filter((piece) => piece.groupe === group),
  }));

  return (
    <div className="operator-page">
      <p className="operator-kicker">FAQ & documents</p>
      <h1>Aide et préparation de dossier</h1>
      <p className="operator-page-intro">Questions fréquentes, guides à télécharger et pièces attendues pour un dossier.</p>

      <div className="operator-block-title">Questions fréquentes</div>
      <section>
        {faq.length === 0 ? <p className="operator-muted">Aucune question pour le moment.</p> : faq.map((item) => (
          <details key={item.documentId} className="operator-accordion">
            <summary>{item.question}</summary>
            <div className="operator-accordion-body">{blocksToText(item.reponse as PortalBlockLike[] | undefined)}</div>
          </details>
        ))}
      </section>

      <div className="operator-block-title">Documents à télécharger</div>
      <section className="operator-card">
        {documents.length === 0 ? <p className="operator-muted">Aucun document disponible.</p> : documents.map((item) => {
          const url = portalMediaUrl(item.file?.url);
          return (
            <div key={`${item.id}-${item.title}`} className="operator-doc-row">
              <span className="operator-doc-name">{item.title}</span>
              {url ? (
                <a href={url} target="_blank" rel="noopener" className="operator-secondary-btn operator-btn-sm">⤓ Télécharger</a>
              ) : (
                <span className="operator-muted">bientôt disponible</span>
              )}
            </div>
          );
        })}
      </section>

      {/* Cible du lien « voir la liste » de l'interstitiel « Avant de commencer ». */}
      <div className="operator-block-title" id="pieces">Pièces du dossier (Annexe 9)</div>
      <section className="operator-card">
        {typePieces.length === 0 ? <p className="operator-muted">Liste des pièces indisponible.</p> : groups.map((group) => (
          group.items.length === 0 ? null : (
            <div key={group.key}>
              <div className="operator-piece-grouptitle">{group.label}</div>
              {group.items.map((piece) => (
                <div key={piece.documentId} className="operator-piece-listrow">
                  <span>{piece.libelle}</span>
                  <span className={`operator-piece-badge${piece.exigence === 'obligatoire' ? ' is-required' : ''}`}>
                    {EXIGENCE_LABELS[piece.exigence || 'obligatoire']}
                  </span>
                </div>
              ))}
            </div>
          )
        ))}
        <p className="operator-field-note">Liste servie depuis les Référentiels (Annexe 9), éditable dans le CMS sans redéploiement.</p>
      </section>
    </div>
  );
}
