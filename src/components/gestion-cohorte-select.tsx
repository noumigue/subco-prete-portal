'use client';

import { useRouter } from 'next/navigation';
import type { GestionAppel } from '@/lib/portal-types';

// Sélecteur de cohorte pour les écrans temps 2 (rapport / décisions / publication).
// Ne s'affiche QUE s'il existe plusieurs cohortes — sinon la page ouvre directement
// la cohorte courante (pilote = une seule cohorte, aucun sélecteur affiché).
export function GestionCohorteSelect({ appels, currentId, base }: { appels: GestionAppel[]; currentId: string; base: string }) {
  const router = useRouter();
  // Cohortes « à venir » exclues : rien à rapporter/décider tant qu'elles ne sont pas actives.
  const list = (appels || []).filter((a) => a.statut !== 'a_venir');
  if (list.length <= 1) return null;

  return (
    <div className="gx-cohorte-select">
      <label htmlFor="gx-cohorte">Cohorte</label>
      <select id="gx-cohorte" value={currentId} onChange={(e) => router.push(`${base}?appel=${encodeURIComponent(e.target.value)}`)}>
        {list.map((a) => (
          <option key={a.documentId} value={a.documentId}>{a.nom || a.codeCohorte || a.documentId}</option>
        ))}
      </select>
    </div>
  );
}
