import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getAdminComptes, getAdminJournal } from '@/lib/gestion-api';
import { GestionAdmin } from '@/components/gestion-admin';

export const dynamic = 'force-dynamic';

// URL de l'admin Strapi (annuaire L4) — jamais en dur : variable d'environnement.
const STRAPI_ADMIN_URL = (process.env.NEXT_PUBLIC_STRAPI_ADMIN_URL
  || `${(process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338').replace(/\/+$/, '')}/admin`).replace(/\/+$/, '');

// M7 — Administration (§3.9/§9.5/§14.10). 4 sous-onglets : Comptes internes / Journal /
// Paramètres & référentiels / Sécurité. `comite` et opérateurs sont hors périmètre.
// L1 : « Comptes internes » n'est servi qu'aux porteurs du drapeau `adminComptes`.
// L3 : le journal transverse + export = tout `ugp` (l'instructeur voit annuaire + sécurité).
export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getPortalSession();
  if (!session) redirect('/gestion/connexion');
  if (session.role === 'comite') redirect('/gestion/seance');
  if (session.role !== 'ugp' && session.role !== 'instructeur') redirect('/gestion/connexion?error=acces-gestion');

  const isUgp = session.role === 'ugp';
  const isAdmin = Boolean(session.adminComptes);
  const { tab } = await searchParams;

  const [comptes, journal] = await Promise.all([
    isAdmin ? getAdminComptes() : Promise.resolve(null),
    isUgp ? getAdminJournal({ periode: '90' }) : Promise.resolve(null),
  ]);

  return (
    <GestionAdmin
      role={isUgp ? 'ugp' : 'instructeur'}
      isAdmin={isAdmin}
      tab={tab || 'comptes'}
      comptes={comptes}
      journal={journal}
      strapiAdminUrl={STRAPI_ADMIN_URL}
    />
  );
}
