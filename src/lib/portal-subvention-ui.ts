import { redirect } from 'next/navigation';
import { getPortalSubvention } from '@/lib/portal-api';
import type { PortalSubvention } from '@/lib/portal-types';

export function bif(value?: string | number | null): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(n)} BIF`;
}

export function pct(part?: string | number | null, total?: string | number | null): string {
  const p = Number(part);
  const t = Number(total);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t === 0) return '';
  return `${Math.round((p / t) * 1000) / 10} %`;
}

export function frDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

// Garde d'acces + vue unique en preparation (V2) : toute route /ma-subvention/* renvoie
// a « Preparation » tant que la convention n'est pas signee. Aucune subvention -> tableau de bord.
export async function requireSubvention(current: 'preparation' | 'convention' | 'suivi' | 'decaissements'): Promise<PortalSubvention> {
  const subvention = await getPortalSubvention();
  if (!subvention) {
    redirect('/tableau-de-bord');
  }
  if (subvention.statut === 'preparation' && current !== 'preparation') {
    redirect('/ma-subvention/preparation');
  }
  return subvention;
}
