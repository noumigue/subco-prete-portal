import { getPortalSession } from '@/lib/portal-auth';
import { getGestionDossiers } from '@/lib/gestion-api';
import { GestionFile } from '@/components/gestion-file';

export const dynamic = 'force-dynamic';

export default async function GestionDossiersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [session, dossiers] = await Promise.all([getPortalSession(), getGestionDossiers()]);
  const role = session?.role === 'ugp' ? 'ugp' : 'instructeur';

  const flash =
    params.pris === '1' ? 'Dossier pris en charge.'
      : params.reassigne === '1' ? 'Réassignation enregistrée.'
        : params.propose === '1' ? 'Proposé à la validation UGP.'
          : params.valide === '1' ? 'Validé — les effets côté candidat sont appliqués.'
            : params.renvoye === '1' ? "Renvoyé à l'instructeur."
              : null;
  const flashError = typeof params.error === 'string' ? params.error : null;

  return <GestionFile dossiers={dossiers} role={role} flash={flash} flashError={flashError} />;
}
