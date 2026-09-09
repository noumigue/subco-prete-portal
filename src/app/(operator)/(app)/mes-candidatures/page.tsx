import Link from 'next/link';
import { getPortalCandidatures, getPortalOpenCalls } from '@/lib/portal-api';
import { portalMediaUrl } from '@/lib/portal-media';
import type { PortalCandidature } from '@/lib/portal-types';
import { OperatorDeleteDraftButton } from '@/components/operator-delete-draft-button';

function formatDate(value?: string | null) {
  if (!value) return 'Non déposé';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function getStatusMeta(group?: string) {
  switch (group) {
    case 'brouillon':
      return { label: '✎ Brouillon', className: 'pill-draft', note: 'PDF filigrane brouillon, sans numéro de dossier.' };
    case 'selectionne':
      return { label: '✓ Sélectionné', className: 'pill-sel', note: 'La suite du parcours se poursuit dans Ma subvention.' };
    case 'non_retenu':
      return { label: '✗ Non retenu', className: 'pill-no', note: '' };
    default:
      return { label: '⏳ En instruction', className: 'pill-inst', note: '' };
  }
}

// Lot 1 : la note d'un dossier déposé dépend de ce que le candidat peut encore en faire.
// Elle disait « dossier non modifiable » — ce n'est plus vrai tant que l'appel est ouvert
// et que l'instruction n'a pas commencé.
function getDossierNote(item: PortalCandidature) {
  if (item.statut?.groupe === 'brouillon') return 'PDF filigrane brouillon, sans numéro de dossier.';
  if (item.statut?.groupe === 'selectionne') return 'La suite du parcours se poursuit dans Ma subvention.';
  if (item.statut?.groupe === 'non_retenu') return '';
  if (item.donneesProjetTravail) {
    return 'Modifications en cours : elles ne seront prises en compte qu’une fois déposées.';
  }
  if (item.appel?.statut === 'ouvert' && item.statut?.phase === 'recu') {
    return 'Dossier déposé. Vous pouvez encore le corriger jusqu’à la clôture de l’appel.';
  }
  return 'PDF permanent figé, dossier non modifiable.';
}

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const deleted = Array.isArray(params.deleted) ? params.deleted[0] : params.deleted;
  const [items, openCalls] = await Promise.all([getPortalCandidatures(), getPortalOpenCalls()]);
  const live = items.filter((item) => item.statut?.groupe === 'brouillon' || item.statut?.groupe === 'en_instruction');
  const history = items.filter((item) => item.statut?.groupe === 'selectionne' || item.statut?.groupe === 'non_retenu');

  return (
    <div className="operator-page">
      <div className="operator-page-head">
        <h1>Mes candidatures</h1>
        {live.length === 0 && openCalls.length > 0 ? <Link href="/candidatures/nouvelle" className="operator-primary-btn inline">+ Nouvelle candidature</Link> : null}
      </div>
      <p className="operator-page-intro">Retrouvez vos dossiers et poursuivez-les selon leur statut.</p>
      {deleted ? <p className="operator-auth-note">Brouillon supprimé.</p> : null}

      {live.length === 0 && history.length === 0 ? (
        <section className="operator-empty-state">
          <h2>Aucune candidature pour le moment</h2>
          <p className="operator-muted">Dès qu&apos;un appel à propositions est ouvert, lancez votre première candidature.</p>
          {openCalls.length > 0 ? <Link href="/candidatures/nouvelle" className="operator-primary-btn inline">+ Nouvelle candidature</Link> : null}
        </section>
      ) : null}

      <section>
        <div className="operator-section-label">En cours <span className="operator-section-count">{live.length}</span></div>
        <div className="operator-list">
          {live.length === 0 ? <p className="operator-muted">Aucune candidature vivante.</p> : live.map((item) => (
            <article key={item.documentId} className="operator-candidature-row">
              <div className="operator-candidature-main">
                <p className="operator-candidature-title">{item.titreProjet}</p>
                <div className="operator-candidature-info">
                  <span className={`operator-status-pill ${getStatusMeta(item.statut?.groupe).className}`}>{getStatusMeta(item.statut?.groupe).label}</span>
                  {item.donneesProjetTravail ? <span className="operator-status-pill pill-comp">✎ Modification non déposée</span> : null}
                  <span>{item.appel?.nom || 'Appel en cours'}</span>
                  {item.numeroDossier ? <span className="operator-candidature-num">{item.numeroDossier}</span> : null}
                  <span>{item.statut?.groupe === 'brouillon' ? 'brouillon en cours' : `déposé le ${formatDate(item.dateDepot)}`}</span>
                </div>
                {getDossierNote(item) ? <div className="operator-candidature-note">{getDossierNote(item)}</div> : null}
              </div>
              <div className="operator-row-actions">
                {item.statut?.code === 'brouillon' ? (
                  <>
                    <Link href={`/candidatures/${item.documentId}/formulaire`} className="operator-primary-btn operator-btn-sm">Reprendre</Link>
                    <a href={`/candidatures/${item.documentId}/pdf-brouillon`} target="_blank" rel="noopener" className="operator-secondary-btn operator-btn-sm">⤓ PDF brouillon</a>
                    <OperatorDeleteDraftButton documentId={item.documentId} />
                  </>
                ) : (
                  <>
                    {item.donneesProjetTravail ? (
                      <Link href={`/candidatures/${item.documentId}/formulaire?modification=1`} className="operator-primary-btn operator-btn-sm">Reprendre la modification</Link>
                    ) : null}
                    <Link href={`/candidatures/${item.documentId}/suivi`} className="operator-secondary-btn operator-btn-sm">Voir le suivi</Link>
                    {portalMediaUrl(item.pdfPermanent?.url) ? (
                      <a href={portalMediaUrl(item.pdfPermanent?.url) || '#'} target="_blank" rel="noopener" className="operator-secondary-btn operator-btn-sm">⤓ PDF du dossier</a>
                    ) : null}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="operator-section-label">Historique <span className="operator-section-count">{history.length}</span></div>
        <div className="operator-list">
          {history.length === 0 ? <p className="operator-muted">Aucun dossier clos.</p> : history.map((item) => (
            <article key={item.documentId} className="operator-candidature-row">
              <div className="operator-candidature-main">
                <p className="operator-candidature-title">{item.titreProjet}</p>
                <div className="operator-candidature-info">
                  <span className={`operator-status-pill ${getStatusMeta(item.statut?.groupe).className}`}>{getStatusMeta(item.statut?.groupe).label}</span>
                  <span>{item.appel?.nom || 'Appel clôturé'}</span>
                  <span className="operator-candidature-num">{item.numeroDossier || 'Numéro indisponible'}</span>
                  <span>décision du {formatDate(item.dateDepot)}</span>
                </div>
                {getStatusMeta(item.statut?.groupe).note ? <div className="operator-candidature-note">{getStatusMeta(item.statut?.groupe).note}</div> : null}
              </div>
              <div className="operator-row-actions">
                {(item.statut?.groupe === 'selectionne' || item.statut?.groupe === 'non_retenu') ? <Link href={`/candidatures/${item.documentId}/suivi`} className="operator-secondary-btn operator-btn-sm">Voir le suivi</Link> : null}
                <button type="button" className="operator-secondary-btn operator-btn-sm">⤓ PDF</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
