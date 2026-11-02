import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDemandeMaj } from '@/lib/portal-api';
import { DemandeMajForm } from '@/components/demande-maj-form';

function dateFr(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function montantFr(n?: number | null) {
  return typeof n === 'number' ? `${n.toLocaleString('fr-FR')} BIF` : '—';
}

// Une demande deja traitee ne se repond pas deux fois : le CMS la refuse. Montrer malgre tout
// un formulaire ouvert laisse l'operateur remplir pour rien, puis se heurter au refus.
// On lui rend donc sa reponse, en lecture seule.
const OUVERTES = ['demandee', 'renvoyee'];

export default async function DemandeMajPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const demande = await getDemandeMaj(documentId);
  if (!demande) notFound();

  const enRetard = demande.echeance ? new Date(demande.echeance).getTime() < Date.now() : false;

  return (
    <section className="operator-card">
      <Link href="/mises-a-jour" className="operator-back-link">
        ← Toutes les mises à jour
      </Link>

      <h1 className="operator-block-title">{demande.type?.libelle || 'Mise à jour demandée'}</h1>
      <p className="operator-candidature-num">
        Dossier {demande.candidature?.numeroDossier} — {demande.candidature?.titreProjet}
      </p>

      {demande.texteDemande ? <p>{demande.texteDemande}</p> : null}

      {OUVERTES.includes(demande.statut) ? (
        <p className={enRetard ? 'operator-auth-error' : 'operator-field-note'}>
          {enRetard
            ? `L’échéance du ${dateFr(demande.echeance)} est passée.`
            : `À répondre avant le ${dateFr(demande.echeance)}.`}
        </p>
      ) : null}

      {OUVERTES.includes(demande.statut) ? (
        <DemandeMajForm demande={demande} />
      ) : (
        <div className="operator-recap operator-card-highlight">
          <p className="operator-field-note">
            {demande.statut === 'validee'
              ? `Votre réponse a été validée par l’équipe du projet. Elle est portée à votre dossier.`
              : demande.statut === 'echue'
                ? `Le délai est écoulé et cette demande est close. Écrivez à candidature@subco-prete.bi si vous souhaitez qu’elle soit rouverte.`
                : `Votre réponse a bien été reçue${demande.soumisLe ? ` le ${dateFr(demande.soumisLe)}` : ''}. Elle est en cours d’examen par l’équipe du projet — vous n’avez rien d’autre à faire.`}
          </p>

          {demande.piecesFournies?.length ? (
            <>
              <h2 className="operator-block-title">Pièces déposées</h2>
              <ul className="operator-bullet-list">
                {demande.piecesFournies.map((p) => (
                  <li key={p.libelle}>
                    {p.libelle} —{' '}
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.nomFichier || 'ouvrir le fichier'}
                      </a>
                    ) : (
                      p.nomFichier || 'fichier déposé'
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {demande.montantsProposes ? (
            <>
              <h2 className="operator-block-title">Montants transmis</h2>
              <ul className="operator-bullet-list">
                <li>Budget total : {montantFr(demande.montantsProposes.budgetTotal)}</li>
                <li>Votre contrepartie : {montantFr(demande.montantsProposes.contrepartie)}</li>
                {demande.montantsProposes.typeContrepartie ? (
                  <li>Nature de la contrepartie : {demande.montantsProposes.typeContrepartie}</li>
                ) : null}
                {demande.montantsProposes.commentaire ? (
                  <li>Ce qui a changé : {demande.montantsProposes.commentaire}</li>
                ) : null}
              </ul>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
