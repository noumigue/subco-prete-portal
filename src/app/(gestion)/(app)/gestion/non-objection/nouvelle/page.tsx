import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionNonObjectionCas } from '@/lib/gestion-api';
import { GestionNonObjectionNouvelle } from '@/components/gestion-nonobjection-nouvelle';

export const dynamic = 'force-dynamic';

// Création réservée à l'UGP (I1) ; instructeur/comité renvoyés au registre.
export default async function NonObjectionNouvellePage() {
  const session = await getPortalSession();
  if (session?.role !== 'ugp') redirect('/gestion/non-objection');
  const cas = await getGestionNonObjectionCas();
  return <GestionNonObjectionNouvelle cas={cas} />;
}
