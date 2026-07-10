import Link from 'next/link';
import { getPortalCandidature } from '@/lib/portal-api';
import { portalMediaUrl as mediaUrl } from '@/lib/portal-media';
import { depositComplementAction } from '../../../../actions';

const phases = ['recu', 'completude', 'eligibilite', 'evaluation', 'decision'] as const;
const labels: Record<(typeof phases)[number], string> = {
  recu: 'Reçu',
  completude: 'Complétude',
  eligibilite: 'Éligibilité',
  evaluation: 'Évaluation',
  decision: 'Décision',
};

function getPill(group?: string, hasComplement?: boolean) {
  if (hasComplement) return { label: '⚠ Complément demandé', className: 'pill-comp' };
  if (group === 'selectionne') return { label: '✓ Sélectionné', className: 'pill-sel' };
  if (group === 'non_retenu') return { label: '✗ Non retenu', className: 'pill-no' };
  return { label: '⏳ En instruction', className: 'pill-inst' };
}

export default async function FollowUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { documentId } = await params;
  const query = await searchParams;
  const flag = Array.isArray(query.complement) ? query.complement[0] : query.complement;
  const errorFlag = Array.isArray(query.error) ? query.error[0] : query.error;
  const candidature = await getPortalCandidature(documentId);
  const currentPhase = candidature?.statut?.phase || 'recu';
  const currentIndex = phases.indexOf(currentPhase);
  const complement = candidature?.complements?.find((item) => item.statut === 'demande');
  const isSelected = candidature?.statut?.groupe === 'selectionne';
  const isRejected = candidature?.statut?.groupe === 'non_retenu';
  const pill = getPill(candidature?.statut?.groupe, Boolean(complement));
  const decisionUrl = mediaUrl(candidature?.notificationDecision?.url);

  return (
    <div className="operator-page">
      <Link href="/mes-candidatures" className="operator-back-link">← Mes candidatures</Link>
      <div className="operator-dossier-head">
        <div>
          <h1>{candidature?.titreProjet}</h1>
          <p className="operator-page-intro"><span className="operator-candidature-num">{candidature?.numeroDossier || 'Numéro en attente'}</span> · {candidature?.appel?.nom}</p>
        </div>
        <div className="operator-dossier-right">
          <span className={`operator-status-pill ${pill.className}`}>{pill.label}</span>
        </div>
      </div>

      {flag === 'depose' ? <p className="operator-auth-note">Pièce complémentaire déposée et ajoutée à votre dossier.</p> : null}
      {errorFlag ? <p className="operator-auth-error">Le dépôt de la pièce n’a pas abouti. Réessayez avec un fichier PDF ou image.</p> : null}

      <div className="operator-block-title">Avancement du dossier</div>
      <section className="operator-card">
        <div className="operator-follow-timeline">
          {phases.map((phase, index) => (
            <div key={phase} className={`operator-follow-step${index < currentIndex ? ' done' : ''}${index === currentIndex ? ' current' : ''}${index === currentIndex && complement ? ' comp' : ''}`}>
              <span className="operator-follow-bead" />
              <div>
                <div className="operator-follow-label">{labels[phase]}</div>
                <div className="operator-follow-meta">{index < currentIndex ? 'Étape franchie' : index === currentIndex ? (complement ? 'Complément attendu' : 'Étape en cours') : 'À venir'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {complement ? (
        <section className="operator-action-card">
          <div className="operator-action-head">⚠ Une pièce complémentaire est demandée</div>
          <p>L&apos;UGP a besoin de <strong>{complement.pieceDemandee}</strong> pour poursuivre la vérification de votre dossier. À fournir avant le <strong>{complement.echeance || 'À confirmer'}</strong>.</p>
          <form action={depositComplementAction} className="operator-action-form">
            <input type="hidden" name="complementId" value={complement.documentId} />
            <input type="hidden" name="candidatureId" value={documentId} />
            <label className="operator-action-drop">
              Déposez ici la pièce demandée (PDF ou image)
              <input type="file" name="fichier" accept=".pdf,image/*" required />
            </label>
            <div className="operator-action-foot">
              <span className="operator-action-hint">Ce dépôt s&apos;ajoute au dossier ; il ne modifie pas votre candidature déjà déposée.</span>
              <button type="submit" className="operator-amber-btn">Envoyer la pièce</button>
            </div>
          </form>
        </section>
      ) : null}

      {isSelected ? (
        <section className="operator-result-card is-selected">
          <h2>✓ Votre candidature a été sélectionnée</h2>
          <p>La convention pourra être suivie dans la section <strong>Ma subvention</strong>.</p>
          {decisionUrl ? (
            <p className="operator-decision-line">
              📄 Notification de décision — document officiel signé, joint par l&apos;UGP.{' '}
              <a href={decisionUrl} target="_blank" rel="noopener" className="operator-text-link">⤓ Télécharger</a>
            </p>
          ) : null}
          <Link href="/ma-subvention" className="operator-primary-btn inline">Accéder à Ma subvention</Link>
        </section>
      ) : null}

      {isRejected ? (
        <section className="operator-result-card is-rejected">
          <h2>✗ Votre candidature n&apos;a pas été retenue</h2>
          <div className="operator-motif-box">
            <span className="operator-motif-label">Motif</span>
            {candidature?.motifDecisionCourt || 'Motif officiel court à renseigner par l’UGP.'}
          </div>
          {decisionUrl ? (
            <p className="operator-decision-line">
              📄 Notification de décision — document officiel signé, joint par l&apos;UGP.{' '}
              <a href={decisionUrl} target="_blank" rel="noopener" className="operator-text-link">⤓ Télécharger</a>
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="operator-block-title">Notifications de ce dossier</div>
      <section className="operator-card">
        <div className="operator-journal">
          {(candidature?.notifications || []).length === 0 ? <p className="operator-muted">Aucune notification rattachée.</p> : candidature?.notifications?.map((item) => (
            <article key={item.documentId} className="operator-journal-row">
              <span className="operator-journal-date">{item.envoyeLe || 'Date à confirmer'}</span>
              <span className="operator-journal-channel">{item.canal?.toUpperCase() || 'EMAIL'}</span>
              <span className="operator-journal-text">{item.sujet || item.corps}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="operator-pdf-bar">
        {mediaUrl(candidature?.pdfPermanent?.url) ? (
          <a href={mediaUrl(candidature?.pdfPermanent?.url) || '#'} target="_blank" rel="noopener" className="operator-secondary-btn inline">
            ⤓ PDF du dossier (permanent)
          </a>
        ) : null}
        <Link href={`/assistance/nouvelle?candidature=${documentId}`} className="operator-text-link">Besoin d&apos;aide sur ce dossier ?</Link>
      </div>
    </div>
  );
}
