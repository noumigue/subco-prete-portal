import { getPortalOrganisation } from '@/lib/portal-api';

export default async function OrganisationPage() {
  const organisation = await getPortalOrganisation();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Mon organisation</p>
      <h1>{organisation?.nom || 'Profil organisation'}</h1>
      <section className="operator-card">
        <dl className="operator-detail-grid">
          <div><dt>Statut juridique</dt><dd>{organisation?.statutJuridique?.libelle || 'A completer'}</dd></div>
          <div><dt>Filiere principale</dt><dd>{organisation?.filierePrincipale?.nom || 'A completer'}</dd></div>
          <div><dt>Province</dt><dd>{organisation?.province?.nom || 'A completer'}</dd></div>
          <div><dt>Commune</dt><dd>{organisation?.commune?.nom || 'A completer'}</dd></div>
          <div><dt>Adresse</dt><dd>{organisation?.adresse || 'A completer'}</dd></div>
          <div><dt>Telephone</dt><dd>{organisation?.telephone || 'A completer'}</dd></div>
        </dl>
      </section>
    </div>
  );
}
