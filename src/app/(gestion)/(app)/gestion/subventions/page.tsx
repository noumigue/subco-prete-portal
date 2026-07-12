import { getGestionSubventions } from '@/lib/gestion-api';
import { GestionSubventionsListe } from '@/components/gestion-subventions-liste';

export const dynamic = 'force-dynamic';

export default async function SubventionsPage() {
  const rows = await getGestionSubventions();
  return <GestionSubventionsListe rows={rows} />;
}
