import Link from 'next/link';
import {
  getPortalFilieres,
  getPortalOrganisation,
  getPortalProvinces,
  getPortalStatutJuridiques,
} from '@/lib/portal-api';
import { OperatorOrganisationForm } from '@/components/operator-organisation-form';

export default async function OrganisationPage() {
  const [organisation, provinces, statutJuridiques, filieres] = await Promise.all([
    getPortalOrganisation(),
    getPortalProvinces(),
    getPortalStatutJuridiques(),
    getPortalFilieres(),
  ]);

  return (
    <div className="operator-page">
      <p className="operator-kicker">Mon organisation</p>
      <h1>Profil de votre organisation</h1>
      <p className="operator-page-intro">Le profil de votre organisation et de son siège. Il pré-remplit vos candidatures.</p>

      {organisation ? (
        <OperatorOrganisationForm
          organisation={organisation}
          provinces={provinces}
          statutJuridiques={statutJuridiques}
          filieres={filieres}
        />
      ) : (
        <section className="operator-empty-state">
          <h2>Votre profil se complétera automatiquement</h2>
          <p className="operator-muted">
            Les informations de votre organisation (siège, statut, filière, contact) seront consolidées lors de votre
            <strong> première candidature</strong>. Vous pourrez ensuite les modifier ici à tout moment.
          </p>
          <Link href="/candidatures/nouvelle" className="operator-primary-btn inline">Commencer une candidature</Link>
        </section>
      )}
    </div>
  );
}
