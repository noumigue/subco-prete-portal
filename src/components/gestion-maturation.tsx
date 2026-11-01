'use client';

import { useState, useTransition } from 'react';
import type { GestionDemandeMaj } from '@/lib/gestion-api';
import {
  renvoyerDemandeMajAction,
  rouvrirDemandeMajAction,
  validerDemandeMajAction,
} from '@/app/(gestion)/actions';

// File des demandes de mise a jour.
//
// Les montants sont valides EN BLOC : budget total, contrepartie et subvention forment un
// seul objet arithmetique, et accepter l'un en refusant l'autre ne voudrait rien dire. Les
// pieces, elles, sont independantes — mais la demande entiere reste ouverte tant que tout
// n'est pas valide, et c'est la validation qui porte les montants dans le dossier.

const LIBELLE: Record<string, string> = {
  demandee: 'À traiter par l’opérateur',
  renvoyee: 'Correction demandée',
  fournie: 'À examiner',
  validee: 'Validée',
  echue: 'Échéance passée',
};

function fr(v?: number | null) {
  return typeof v === 'number' ? new Intl.NumberFormat('fr-FR').format(v) : '—';
}

function dateFr(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
}

function Ligne({ demande }: { demande: GestionDemandeMaj }) {
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [renvoiOuvert, setRenvoiOuvert] = useState(false);

  const montants = demande.montantsProposes;
  const aExaminer = demande.statut === 'fournie';

  function lancer(action: () => Promise<{ ok: boolean; error?: string }>) {
    setErreur(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setErreur(r.error || "L'action a échoué.");
      else setRenvoiOuvert(false);
    });
  }

  return (
    <article className="gx-card">
      <header className="gx-dhead">
        <strong>{demande.candidature?.numeroDossier}</strong>
        <span> — {demande.candidature?.organisation?.nom || demande.candidature?.titreProjet}</span>
        <span className="gx-pill">{LIBELLE[demande.statut] || demande.statut}</span>
      </header>

      <p className="gx-meta">
        {demande.type?.libelle} · échéance {dateFr(demande.echeance)}
        {demande.campagne ? ` · campagne ${demande.campagne}` : ''}
        {demande.soumisLe ? ` · répondu le ${dateFr(demande.soumisLe)}` : ''}
      </p>

      {demande.piecesFournies && demande.piecesFournies.length > 0 ? (
        <ul className="gx-plist">
          {demande.piecesFournies.map((p) => (
            <li key={p.libelle}>
              {p.libelle} — {p.nomFichier || 'fichier déposé'}
            </li>
          ))}
        </ul>
      ) : null}

      {montants ? (
        <table className="gx-constable">
          <tbody>
            <tr>
              <td>Budget total proposé</td>
              <td>{fr(montants.budgetTotal)}</td>
            </tr>
            <tr>
              <td>Contrepartie proposée</td>
              <td>{fr(montants.contrepartie)}</td>
            </tr>
            <tr>
              <td>Subvention qui en découle</td>
              <td>
                {typeof montants.budgetTotal === 'number' && typeof montants.contrepartie === 'number'
                  ? fr(montants.budgetTotal - montants.contrepartie)
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      ) : null}

      {montants?.commentaire ? <p className="gx-meta">« {montants.commentaire} »</p> : null}

      {demande.statut === 'validee' ? (
        <p className="gx-meta">
          Validée par {demande.validePar}{demande.valideParRole ? ` (${demande.valideParRole})` : ''} le{' '}
          {dateFr(demande.valideLe)}
          {demande.versionProduite ? ` — version ${demande.versionProduite} du dossier` : ''}
        </p>
      ) : null}

      {erreur ? <p className="gx-mat-erreur">{erreur}</p> : null}

      <div className="gx-actions">
        {aExaminer ? (
          <>
            <button type="button" className="gx-btn gx-btn-primary" disabled={enCours} onClick={() => lancer(() => validerDemandeMajAction(demande.documentId))}>
              Valider
            </button>
            <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours} onClick={() => setRenvoiOuvert((v) => !v)}>
              Renvoyer
            </button>
          </>
        ) : null}
        {demande.statut === 'echue' ? (
          <button type="button" className="gx-btn gx-btn-ghost" disabled={enCours} onClick={() => lancer(() => rouvrirDemandeMajAction(demande.documentId, 3))}>
            Rouvrir (3 jours ouvrés)
          </button>
        ) : null}
      </div>

      {renvoiOuvert ? (
        <div className="gx-mat-renvoi">
          <label htmlFor={`motif-${demande.documentId}`}>Motif du renvoi — il est transmis à l’opérateur</label>
          <textarea
            id={`motif-${demande.documentId}`}
            rows={2}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          <p className="gx-meta">Le renvoi porte une nouvelle échéance de trois jours ouvrés.</p>
          <button
            type="button"
            className="gx-btn gx-btn-gold"
            disabled={enCours || motif.trim().length === 0}
            onClick={() => lancer(() => renvoyerDemandeMajAction(demande.documentId, motif.trim(), 3))}
          >
            Confirmer le renvoi
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function GestionMaturation({ demandes, compte }: { demandes: GestionDemandeMaj[]; compte: Record<string, number> }) {
  const ordre = ['fournie', 'renvoyee', 'demandee', 'echue', 'validee'];
  const triees = [...demandes].sort((a, b) => ordre.indexOf(a.statut) - ordre.indexOf(b.statut));

  return (
    <>
      <p className="gx-meta">
        {ordre
          .filter((s) => compte[s])
          .map((s) => `${compte[s]} ${LIBELLE[s].toLowerCase()}`)
          .join(' · ') || 'Aucune demande en cours.'}
      </p>
      {triees.map((d) => (
        <Ligne key={d.documentId} demande={d} />
      ))}
    </>
  );
}
