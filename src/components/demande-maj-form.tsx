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
  // Les champs ouverts sont DECRITS par le CMS — libelle, type, valeurs admises, valeur
  // actuelle. Le formulaire n'a pas sa propre definition du formulaire de candidature :
  // une seule definition, au CMS, sert la campagne, la validation et cet ecran.
  const champs = demande.champs || [];
  const couple = champs.some((c) => c.cle === 'financement.budgetTotal');
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

      {champs.length > 0 ? (
        <>
          <h3 className="operator-block-title">Informations à mettre à jour</h3>
          <p className="operator-field-note">
            Seuls les champs ci-dessous sont ouverts. Ils sont pré-remplis avec les valeurs
            actuelles de votre dossier : corrigez ce qui doit l’être.
            {couple ? ' Le budget total et la contrepartie vont ensemble ; la subvention demandée est leur différence.' : ''}
          </p>
          {champs.map((champ) => {
            const nom = `champ::${champ.cle}`;
            const valeur = champ.valeurProposee ?? champ.valeurActuelle ?? '';
            return (
              <div key={champ.cle} className="operator-form-field">
                <label htmlFor={nom}>{champ.libelle}</label>
                {champ.type === 'choix' && champ.options?.length ? (
                  <select id={nom} name={nom} defaultValue={String(valeur)}>
                    <option value="">Sélectionner…</option>
                    {/* La valeur actuelle peut ne plus figurer au référentiel : on l'ajoute
                        plutôt que de la faire disparaître du formulaire. */}
                    {[...new Set([...(champ.options || []), ...(valeur ? [String(valeur)] : [])])].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : champ.type === 'texteLong' ? (
                  <textarea
                    id={nom}
                    name={nom}
                    rows={3}
                    {...(champ.max ? { maxLength: champ.max } : {})}
                    defaultValue={String(valeur)}
                  />
                ) : (
                  <input
                    id={nom}
                    name={nom}
                    type="text"
                    {...(champ.type === 'montant' || champ.type === 'nombre' ? { inputMode: 'numeric' as const } : {})}
                    defaultValue={champ.type === 'montant' ? montantFr(Number(valeur) || null) : String(valeur)}
                  />
                )}
                {champ.type === 'montant' ? (
                  <p className="operator-field-note">En francs burundais.</p>
                ) : null}
              </div>
            );
          })}
          <div className="operator-form-field">
            <label htmlFor="commentaire">Ce qui a changé depuis la séance de travail</label>
            <textarea id="commentaire" name="commentaire" rows={3} />
          </div>
        </>
      ) : null}

      {erreur ? <p className="operator-auth-error">{erreur}</p> : null}
      {envoye ? (
        <p className="operator-auth-note">
          Votre réponse est enregistrée. Elle sera examinée par l’équipe du projet ; votre dossier
          ne sera actualisé qu’après sa validation.
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
