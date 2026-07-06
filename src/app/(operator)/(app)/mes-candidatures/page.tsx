import Link from 'next/link';
import { deleteDraftAction } from '../../actions';
import { getPortalCandidatures, getPortalOpenCalls } from '@/lib/portal-api';

function formatDate(value?: string | null) {
  if (!value) return 'Non depose';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function getStatusMeta(group?: string) {
  switch (group) {
    case 'brouillon':
      return { label: '✎ Brouillon', className: 'pill-draft', note: 'PDF filigrane brouillon, sans numero de dossier.' };
    case 'selectionne':
      return { label: '✓ Selectionne', className: 'pill-sel', note: 'La suite du parcours se poursuit dans Ma subvention.' };
    case 'non_retenu':
      return { label: '✗ Non retenu', className: 'pill-no', note: '' };
    default:
      return { label: '⏳ En instruction', className: 'pill-inst', note: 'PDF permanent fige, dossier non modifiable.' };
  }
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
      {deleted ? <p className="operator-auth-note">Brouillon supprime.</p> : null}

      {live.length === 0 && history.length === 0 ? (
        <section className="operator-empty-state">
          <h2>Aucune candidature pour le moment</h2>
          <p className="operator-muted">Des qu&apos;un appel a propositions est ouvert, lancez votre premiere candidature.</p>
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
                  <span>{item.appel?.nom || 'Appel en cours'}</span>
                  <span className="operator-candidature-num">{item.numeroDossier || 'Numero attribue a la soumission'}</span>
                  <span>{item.statut?.groupe === 'brouillon' ? `modifie le ${formatDate(item.dateDepot)}` : `depose le ${formatDate(item.dateDepot)}`}</span>
                </div>
                {getStatusMeta(item.statut?.groupe).note ? <div className="operator-candidature-note">{getStatusMeta(item.statut?.groupe).note}</div> : null}
              </div>
              <div className="operator-row-actions">
                {item.statut?.code === 'brouillon' ? (
                  <>
                    <Link href={`/candidatures/${item.documentId}/formulaire`} className="operator-primary-btn operator-btn-sm">Reprendre</Link>
                    <button type="button" className="operator-secondary-btn operator-btn-sm">⤓ PDF brouillon</button>
                    <form action={deleteDraftAction}>
                      <input type="hidden" name="documentId" value={item.documentId} />
                      <button type="submit" className="operator-danger-btn operator-btn-sm">🗑 Supprimer</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href={`/candidatures/${item.documentId}/suivi`} className="operator-secondary-btn operator-btn-sm">Voir le suivi</Link>
                    <button type="button" className="operator-secondary-btn operator-btn-sm">⤓ PDF du dossier</button>
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
                  <span>{item.appel?.nom || 'Appel cloture'}</span>
                  <span className="operator-candidature-num">{item.numeroDossier || 'Numero indisponible'}</span>
                  <span>decision du {formatDate(item.dateDepot)}</span>
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
