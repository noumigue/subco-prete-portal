import { getGestionDemandesMaj, getGestionPiecesReferentiel } from '@/lib/gestion-api';
import { GestionMaturation } from '@/components/gestion-maturation';
import { GestionMaturationCampagne } from '@/components/gestion-maturation-campagne';

export const dynamic = 'force-dynamic';

export default async function MaturationPage() {
  const [data, refs] = await Promise.all([getGestionDemandesMaj(), getGestionPiecesReferentiel()]);

  return (
    <section className="gx-page">
      <h1>Mises à jour des dossiers</h1>
      <p className="gx-meta">
        Les demandes adressées aux opérateurs après le dépôt. Une campagne ne demande qu’une
        seule chose — des champs du formulaire, une pièce d’un type nouveau, ou une nouvelle
        version d’une pièce déjà déposée — et chacune a son échéance : l’opérateur répond à
        chacune quand il peut. Le Cabinet comme l’UGP peuvent valider ; la plateforme enregistre
        qui l’a fait. Les montants ne sont portés au dossier qu’à la validation.
      </p>

      <GestionMaturationCampagne pieces={refs?.pieces || []} />

      {data ? (
        <GestionMaturation demandes={data.demandes} compte={data.compte} />
      ) : (
        <p className="gx-error">La file n’a pas pu être chargée. Votre session a peut-être expiré.</p>
      )}
    </section>
  );
}
