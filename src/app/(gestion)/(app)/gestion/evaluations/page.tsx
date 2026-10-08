import { getMesEvaluations } from '@/lib/gestion-api';
import { GestionMesEvaluations } from '@/components/gestion-mes-evaluations';

export const dynamic = 'force-dynamic';

export default async function MesEvaluationsPage() {
  const { rows, meta } = await getMesEvaluations();

  return <GestionMesEvaluations rows={rows} meta={meta} />;
}
