'use client';

import { useState, useTransition } from 'react';
import type { PortalDemandeMaj } from '@/lib/portal-api';
import { soumettreDemandeMajAction } from '@/app/(operator)/actions';

// Formulaire de reponse a une demande de mise a jour.
//
// L'ecran ne montre QUE ce qui est demande : les pieces du perimetre et, si les montants
// sont ouverts, le bloc budget. Le perimetre a ete fige a la creation de la demande cote
// CMS — un referentiel modifie en cours de route n'elargit pas retroactivement ce qu'un
// operateur peut changer sur un dossier dont la note est figee.

function montantFr(v?: number | null) {
  return typeof v === 'number' ? new Intl.NumberFormat('fr-FR').format(v) : '';
}

export function DemandeMajForm({ demande }: { demande: PortalDemandeMaj }) {
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  const perimetre = demande.perimetre || {};
  const pieces = perimetre.pieces || [];
  const montantsOuverts = Boolean(perimetre.montants);
  const dejaFournies = new Map((demande.piecesFournies || []).map((p) => [p.libelle, p]));
  const ferme = demande.statut === 'validee' || demande.statut === 'echue';

  function onSubmit(formData: FormData) {
    setErreur(null);
    startTransition(async () => {
      const resultat = await soumettreDemandeMajAction(demande.documentId, formData);
      if (resultat.ok) setEnvoye(true);
      else setErreur(resultat.error || "L'envoi n'a pas abouti.");
    });
  }

  if (ferme) {
    return (
      <p className="operator-auth-note">
        {demande.statut === 'validee'
          ? 'Cette mise à jour a été validée. Les montants de votre dossier ont été actualisés.'
          : "L’échéance de cette demande est passée. Écrivez à candidature@subco-prete.bi pour qu’elle soit rouverte."}
      </p>
    );
  }

  return (
    <form action={onSubmit} className="operator-action-form">
      {demande.motifRenvoi ? (
        <p className="operator-auth-error">
          <strong>Correction demandée :</strong> {demande.motifRenvoi}
        </p>
      ) : null}

      {pieces.length > 0 ? (
        <>
          <h3 className="operator-block-title">Pièces à déposer</h3>
          {pieces.map((piece) => {
            const deja = dejaFournies.get(piece.libelle);
            return (
              <div key={piece.libelle} className="operator-form-field">
                <label htmlFor={`piece::${piece.libelle}`}>
                  {piece.libelle}
                  {piece.exigence && piece.exigence !== 'obligatoire' ? (
                    <span className="operator-field-note"> — {piece.exigence.replace('_', ' ')}</span>
                  ) : null}
                </label>
                {deja?.nomFichier ? (
                  <p className="operator-field-note">Déjà déposé : {deja.nomFichier}. En redéposer un remplacera le précédent.</p>
                ) : null}
                <input
                  id={`piece::${piece.libelle}`}
                  name={`piece::${piece.libelle}`}
                  type="file"
                  accept="application/pdf,image/*"
                />
              </div>
            );
          })}
        </>
      ) : null}

      {montantsOuverts ? (
        <>
          <h3 className="operator-block-title">Montants révisés</h3>
          <p className="operator-field-note">
            Montants en francs burundais. La contrepartie ne peut pas dépasser le budget total ;
            la subvention demandée est la différence entre les deux.
          </p>
          <div className="operator-form-grid">
            <div className="operator-form-field">
              <label htmlFor="budgetTotal">Budget total du projet</label>
              <input
                id="budgetTotal"
                name="budgetTotal"
                inputMode="numeric"
                defaultValue={montantFr(demande.montantsProposes?.budgetTotal)}
                required
              />
            </div>
            <div className="operator-form-field">
              <label htmlFor="contrepartie">Votre contrepartie</label>
              <input
                id="contrepartie"
                name="contrepartie"
                inputMode="numeric"
                defaultValue={montantFr(demande.montantsProposes?.contrepartie)}
                required
              />
            </div>
          </div>
          <div className="operator-form-field">
            <label htmlFor="typeContrepartie">Nature de la contrepartie</label>
            <input
              id="typeContrepartie"
              name="typeContrepartie"
              defaultValue={demande.montantsProposes?.typeContrepartie || ''}
              placeholder="Numéraire, nature, mixte…"
            />
          </div>
          <div className="operator-form-field">
            <label htmlFor="commentaire">Ce qui a changé depuis la séance de travail</label>
            <textarea
              id="commentaire"
              name="commentaire"
              rows={3}
              defaultValue={demande.montantsProposes?.commentaire || ''}
            />
          </div>
        </>
      ) : null}

      {erreur ? <p className="operator-auth-error">{erreur}</p> : null}
      {envoye ? (
        <p className="operator-auth-note">
          Votre réponse est enregistrée. Elle sera examinée par l’équipe du projet ; vos montants
          ne seront actualisés qu’après sa validation.
        </p>
      ) : null}

      <div className="operator-form-actions">
        <button type="submit" className="operator-amber-btn" disabled={enCours}>
          {enCours ? 'Envoi en cours…' : 'Envoyer ma réponse'}
        </button>
      </div>
    </form>
  );
}
