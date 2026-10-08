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
  const [session, { rows: dossiers, tronque }] = await Promise.all([getPortalSession(), getGestionDossiers()]);
  const role = session?.role === 'ugp' ? 'ugp' : 'instructeur';

  const flash =
    params.pris === '1' ? 'Dossier pris en charge.'
      : params.reassigne === '1' ? 'Réassignation enregistrée.'
        : params.propose === '1' ? 'Proposé à la validation UGP.'
          : params.valide === '1' ? 'Validé — les effets côté candidat sont appliqués.'
            : params.renvoye === '1' ? "Renvoyé à l'instructeur."
              : params.reouvert === '1' ? "Complétude rouverte — le dossier est revenu à l'instructeur."
                : null;
  const flashError = typeof params.error === 'string' ? params.error : null;

  return (
    <GestionFile
      dossiers={dossiers}
      role={role}
      currentUserId={session?.userId ?? null}
      flash={flash}
      // Une file tronquee doit se voir : c'est ce silence qui a masque deux dossiers a un
      // evaluateur le 08/10. Le message prime sur une autre erreur eventuelle.
      flashError={tronque ? "La file a atteint sa limite d'affichage : des dossiers peuvent manquer. Signalez-le à l'équipe projet." : flashError}
    />
  );
}
