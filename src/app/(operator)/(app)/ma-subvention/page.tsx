import { redirect } from 'next/navigation';
import { getPortalSubvention } from '@/lib/portal-api';

// Point d'entree « Ma subvention » : redirige vers la bonne vue selon le statut.
export default async function MaSubventionPage() {
  const subvention = await getPortalSubvention();
  if (!subvention) {
    redirect('/tableau-de-bord');
  }
  redirect(subvention.statut === 'preparation' ? '/ma-subvention/preparation' : '/ma-subvention/convention');
}
