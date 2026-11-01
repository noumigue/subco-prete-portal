import Link from 'next/link';
import { getMesDemandesMaj } from '@/lib/portal-api';

const LIBELLE_STATUT: Record<string, string> = {
  demandee: 'À traiter',
  renvoyee: 'Correction demandée',
  fournie: 'En cours d’examen',
  validee: 'Validée',
  echue: 'Échéance passée',
};

function dateFr(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function MisesAJourPage() {
  const demandes = await getMesDemandesMaj();
  const aTraiter = demandes.filter((d) => d.statut === 'demandee' || d.statut === 'renvoyee');
  const autres = demandes.filter((d) => !aTraiter.includes(d));

  return (
    <section className="operator-card">
      <h1 className="operator-block-title">Mises à jour demandées</h1>
      <p className="operator-auth-note">
        Après une séance de travail, l’équipe du projet peut vous demander de compléter ou de
        corriger une partie de votre dossier. Vous ne modifiez que ce qui vous est demandé — le
        reste de votre dossier déposé n’est pas touché.
      </p>

      {demandes.length === 0 ? (
        <p className="operator-field-note">Aucune mise à jour ne vous est demandée pour le moment.</p>
      ) : null}

      {aTraiter.length > 0 ? (
        <ul className="operator-demandes-liste">
          {aTraiter.map((d) => (
            <li key={d.documentId} className="operator-demande-item">
              <Link href={`/mises-a-jour/${d.documentId}`} className="operator-demande-titre">
                {d.type?.libelle || 'Mise à jour'} — dossier {d.candidature?.numeroDossier}
              </Link>
              <p className="operator-field-note">
                {LIBELLE_STATUT[d.statut]} · à répondre avant le {dateFr(d.echeance)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {autres.length > 0 ? (
        <>
          <h2 className="operator-block-title">Déjà traitées</h2>
          <ul className="operator-demandes-liste">
            {autres.map((d) => (
              <li key={d.documentId} className="operator-demande-item">
                <Link href={`/mises-a-jour/${d.documentId}`} className="operator-demande-titre">
                  {d.type?.libelle || 'Mise à jour'} — dossier {d.candidature?.numeroDossier}
                </Link>
                <p className="operator-field-note">{LIBELLE_STATUT[d.statut]}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
