import Link from 'next/link';
import { getPortalCandidature, getPortalTypePieces } from '@/lib/portal-api';
import type { PortalDonneesProjet } from '@/lib/portal-types';
import { portalMediaUrl as mediaUrl } from '@/lib/portal-media';
import { addPieceAction, depositComplementAction } from '../../../../actions';

const phases = ['recu', 'completude', 'eligibilite', 'evaluation', 'decision'] as const;
const labels: Record<(typeof phases)[number], string> = {
  recu: 'Reçu',
  completude: 'Complétude',
  eligibilite: 'Éligibilité',
  evaluation: 'Évaluation',
  decision: 'Décision',
};

// Les anciens dépôts de complément redirigent avec un CODE d'erreur ; l'ajout spontané de
// pièce (Lot 0) redirige avec le MESSAGE du CMS, qui est porteur de sens pour le candidat
// (« l'appel est clos », « ce dossier n'est pas encore déposé »). On affiche donc le message
// tel quel quand ce n'est pas un code connu.
const ERREURS_CONNUES: Record<string, string> = {
  complement: 'Le dépôt de la pièce n’a pas abouti. Réessayez avec un fichier PDF ou image.',
  upload: 'Le téléversement du fichier a échoué. Réessayez avec un PDF ou une image.',
  depot: 'Le dépôt de la pièce n’a pas abouti.',
};

function formatDay(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

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
  const pieceFlag = Array.isArray(query.piece) ? query.piece[0] : query.piece;
  const [candidature, typePieces] = await Promise.all([
    getPortalCandidature(documentId),
    getPortalTypePieces(),
  ]);
  const currentPhase = candidature?.statut?.phase || 'recu';
  const currentIndex = phases.indexOf(currentPhase);
  const complement = candidature?.complements?.find((item) => item.statut === 'demande');
  const isSelected = candidature?.statut?.groupe === 'selectionne';
  const isRejected = candidature?.statut?.groupe === 'non_retenu';
  const pill = getPill(candidature?.statut?.groupe, Boolean(complement));
  const decisionUrl = mediaUrl(candidature?.notificationDecision?.url);
  const erreur = errorFlag ? ERREURS_CONNUES[errorFlag] || errorFlag : null;

  // Ajout spontané de pièce : réservé à un dossier DÉJÀ DÉPOSÉ, tant que l'appel est ouvert.
  // Sur un brouillon, les pièces ont leur place normale dans le formulaire (et entrent dans
  // le PDF) ; après la clôture, seules les pièces réclamées par l'UGP restent déposables.
  const dateCloture = formatDay(candidature?.appel?.clotureLe);
  const peutAjouterPiece = Boolean(
    candidature?.numeroDossier &&
      candidature?.statut?.code !== 'brouillon' &&
      candidature?.appel?.statut === 'ouvert',
  );

  // Tout ce qui est arrivé APRÈS le dépôt, quelle qu'en soit l'origine : les pièces réclamées
  // par l'UGP et déjà fournies, et celles que le candidat a ajoutées de lui-même.
  const piecesAjoutees = (candidature?.complements || [])
    .filter((item) => item.statut === 'fourni')
    .map((item) => ({
      documentId: item.documentId,
      libelle: item.pieceDemandee || 'Pièce',
      spontanee: item.origine === 'candidat',
      url: mediaUrl(item.fichier?.url),
    }));

  // Pieces deposees : relire ce qu'on a envoye est la premiere chose qu'un candidat
  // cherche apres depot. Les fichiers sont resolus cote CMS (`piecesFichiers`).
  const fichiersPieces = candidature?.piecesFichiers || {};
  const piecesDeposees = ((candidature?.donneesProjet as PortalDonneesProjet | null)?.pieces || [])
    .filter((piece) => piece.depose && piece.fileId)
    .map((piece) => ({
      id: piece.id,
      libelle: piece.libelle,
      nom: fichiersPieces[String(piece.fileId)]?.nom || piece.nomFichier || 'Pièce déposée',
      url: mediaUrl(fichiersPieces[String(piece.fileId)]?.url),
    }));

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
      {pieceFlag === 'ajoutee' ? <p className="operator-auth-note">Pièce ajoutée à votre dossier. Votre candidature déposée reste inchangée par ailleurs.</p> : null}
      {erreur ? <p className="operator-auth-error">{erreur}</p> : null}

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

      {piecesDeposees.length ? (
        <>
          <div className="operator-block-title">Pièces que vous avez déposées</div>
          <section className="operator-card">
            <p className="operator-page-intro">Ce sont les {piecesDeposees.length} fichiers reçus avec votre dossier. Cliquez pour les rouvrir.</p>
            <div className="gx-pieces-depot">
              {piecesDeposees.map((piece) => (
                piece.url
                  ? <a key={piece.id} className="gx-pc" href={piece.url} target="_blank" rel="noopener noreferrer" title={piece.libelle}>⤓ {piece.nom}</a>
                  : <span key={piece.id} className="gx-pc" title={piece.libelle}>{piece.nom}</span>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {piecesAjoutees.length ? (
        <>
          <div className="operator-block-title">Pièces ajoutées après le dépôt</div>
          <section className="operator-card">
            <p className="operator-page-intro">
              {piecesAjoutees.length > 1
                ? `Ces ${piecesAjoutees.length} fichiers complètent votre dossier. Ils ne figurent pas dans le PDF de candidature, qui reste celui du jour du dépôt.`
                : 'Ce fichier complète votre dossier. Il ne figure pas dans le PDF de candidature, qui reste celui du jour du dépôt.'}
            </p>
            <div className="gx-pieces-depot">
              {piecesAjoutees.map((piece) => (
                piece.url
                  ? <a key={piece.documentId} className="gx-pc" href={piece.url} target="_blank" rel="noopener noreferrer" title={piece.spontanee ? 'Ajoutée par vous' : 'Demandée par l’UGP'}>⤓ {piece.libelle}</a>
                  : <span key={piece.documentId} className="gx-pc" title={piece.libelle}>{piece.libelle}</span>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {peutAjouterPiece ? (
        <>
          <div className="operator-block-title">Ajouter une pièce à mon dossier</div>
          <section className="operator-card">
            <p className="operator-page-intro">
              Une pièce vous manque ? Vous pouvez l’ajouter vous-même{dateCloture ? <> jusqu’à la clôture de l’appel, le <strong>{dateCloture}</strong></> : null}.
              Elle s’ajoute à votre dossier déjà déposé : votre numéro de dossier, votre date de dépôt et le
              PDF de votre candidature restent inchangés.
            </p>
            <form action={addPieceAction}>
              <input type="hidden" name="candidatureId" value={documentId} />
              <div className="operator-form-grid">
                <div className="operator-form-field">
                  <label htmlFor="typePiece">De quelle pièce s’agit-il ?</label>
                  <select id="typePiece" name="typePiece" defaultValue="" required>
                    <option value="" disabled>Sélectionner une pièce…</option>
                    {typePieces.map((type) => (
                      <option key={type.documentId} value={type.libelle || ''}>{type.libelle}</option>
                    ))}
                    <option value="autre">Autre pièce…</option>
                  </select>
                </div>
                <div className="operator-form-field">
                  <label htmlFor="autreLibelle">Si « autre », précisez</label>
                  <input id="autreLibelle" type="text" name="autreLibelle" maxLength={120} placeholder="Nom de la pièce" />
                </div>
              </div>
              <div className="operator-form-field">
                <label className="operator-action-drop">
                  Choisissez le fichier à joindre (PDF ou image)
                  <input type="file" name="fichier" accept=".pdf,image/*" required />
                </label>
              </div>
              <div className="operator-form-actions">
                <button type="submit" className="operator-primary-btn inline">Ajouter la pièce</button>
                <span className="operator-field-note">
                  Le dépôt est immédiat et vous recevrez une confirmation. Pour corriger une information
                  du formulaire (montant, description…), passez par « Besoin d’aide sur ce dossier ? ».
                </span>
              </div>
            </form>
          </section>
        </>
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
