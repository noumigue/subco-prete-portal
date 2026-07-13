import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import {
  getGestionAppels,
  getSeTableauDeBord,
  getSeIndicateurs,
  getSeDepouillements,
  getSeRapports,
} from '@/lib/gestion-api';
import { GestionSe } from '@/components/gestion-se';

export const dynamic = 'force-dynamic';

// M6 — Suivi-évaluation (§14) : 4 sous-onglets ; ugp + instructeur ; comité exclu.
export default async function SePage({
  searchParams,
}: {
  searchParams: Promise<{ cohorte?: string; tab?: string }>;
}) {
  const session = await getPortalSession();
  if (session?.role === 'comite') redirect('/gestion/seance');

  const { cohorte, tab } = await searchParams;
  const appels = await getGestionAppels();
  const cohortes = [
    { documentId: 'toutes', label: 'Toutes les cohortes' },
    ...appels.map((a) => ({ documentId: a.documentId, label: a.nom || a.codeCohorte || 'Cohorte' })),
  ];
  const activeCohorte = cohorte && cohortes.some((c) => c.documentId === cohorte) ? cohorte : 'toutes';

  const [tableauDeBord, indicateurs, depouillements, rapports] = await Promise.all([
    getSeTableauDeBord(activeCohorte),
    getSeIndicateurs(activeCohorte),
    getSeDepouillements(),
    getSeRapports(),
  ]);

  return (
    <GestionSe
      role={session?.role === 'ugp' ? 'ugp' : 'cabinet'}
      cohortes={cohortes}
      cohorte={activeCohorte}
      tab={tab || 'tdb'}
      tableauDeBord={tableauDeBord}
      indicateurs={indicateurs}
      depouillements={depouillements}
      rapports={rapports}
    />
  );
}
