import { redirect } from 'next/navigation';
import { OperatorShell } from '@/components/operator-shell';
import { requirePortalSession } from '@/lib/portal-auth';
import { getPortalNotifications, getPortalSubventionStatut } from '@/lib/portal-api';
import { getBrandAssets } from '@/lib/strapi-public';

// Garde d'acces (app) par role (remediation 2.4) : seuls les operateurs
// { candidat, beneficiaire } entrent dans l'espace operateur. Les roles internes
// (instructeur/ugp/comite/banque) seront routes vers leur porte back-office (Modules 5-7).
const OPERATOR_ROLES = new Set(['candidat', 'beneficiaire']);

export default async function OperatorAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requirePortalSession();
  if (!OPERATOR_ROLES.has(session.role)) {
    redirect('/connexion?error=acces-operateur');
  }
  const [notifications, subventionStatut, brand] = await Promise.all([
    getPortalNotifications(),
    getPortalSubventionStatut(),
    getBrandAssets(),
  ]);
  const unreadCount = notifications.filter((item) => !item.lu).length;

  return (
    <OperatorShell session={session} unreadCount={unreadCount} subventionStatut={subventionStatut} brand={brand}>
      {children}
    </OperatorShell>
  );
}
