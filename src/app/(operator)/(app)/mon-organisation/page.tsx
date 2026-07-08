import { getPortalOrganisation } from '@/lib/portal-api';

export default async function OrganisationPage() {
  const organisation = await getPortalOrganisation();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Mon organisation</p>
      <h1>{organisation?.nom || 'Profil organisation'}</h1>
      <section className="operator-card">
        <dl className="operator-detail-grid">
          <div><dt>Statut juridique</dt><dd>{organisation?.statutJuridique?.libelle || 'À compléter'}</dd></div>
          <div><dt>Filière principale</dt><dd>{organisation?.filierePrincipale?.nom || 'À compléter'}</dd></div>
          <div><dt>Province</dt><dd>{organisation?.province?.nom || 'À compléter'}</dd></div>
          <div><dt>Commune</dt><dd>{organisation?.commune?.nom || 'À compléter'}</dd></div>
          <div><dt>Adresse</dt><dd>{organisation?.adresse || 'À compléter'}</dd></div>
          <div><dt>Téléphone</dt><dd>{organisation?.telephone || 'À compléter'}</dd></div>
        </dl>
      </section>
    </div>
  );
}
