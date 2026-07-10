import { requireSubvention } from '@/lib/portal-subvention-ui';
import { getPortalModalites } from '@/lib/portal-api';
import { portalMediaUrl } from '@/lib/portal-media';
import { OperatorDecaissements } from '@/components/operator-decaissements';

// Miroir cote UI de la regle 11.4 (la garde autoritative est cote serveur).
const BLOCKING = ['soumise', 'avis_technique', 'avis_fiduciaire', 'complements_requis'];

export default async function DecaissementsPage() {
  const [subvention, modalites] = await Promise.all([requireSubvention('decaissements'), getPortalModalites()]);
  const demandes = subvention.demandes || [];

  const enInstruction = demandes.some((d) => BLOCKING.includes(d.statut?.code || ''));
  const aJustifier = demandes.some((d) => d.aJustifier && d.justificationStatut !== 'validee');
  const canNew = !enInstruction && !aJustifier;
  const blockMessage = enInstruction
    ? 'une demande est en cours d’instruction.'
    : 'aucun nouveau décaissement tant que l’avance précédente n’est pas entièrement justifiée et validée (règle 11.4).';

  // Plan de decaissement = document contractuel lettre E.
  const planE = (subvention.documentsContractuels || []).find((d) => d.lettre === 'E');
  const planUrl = portalMediaUrl(planE?.fichier?.url);

  return (
    <OperatorDecaissements
      subvention={subvention}
      modalites={modalites}
      canNew={canNew}
      blockMessage={blockMessage}
      planUrl={planUrl}
    />
  );
}
