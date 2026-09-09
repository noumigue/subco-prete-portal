import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OperatorShell } from '@/components/operator-shell';
import { requirePortalSession } from '@/lib/portal-auth';
import { getPortalCandidatures, getPortalNotifications, getPortalSubventionStatut } from '@/lib/portal-api';
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
  const [notifications, subventionStatut, brand, candidatures] = await Promise.all([
    getPortalNotifications(),
    getPortalSubventionStatut(),
    getBrandAssets(),
    getPortalCandidatures(),
  ]);
  const unreadCount = notifications.filter((item) => !item.lu).length;

  // Lot 1 — un dossier modifié mais non redéposé est le seul état où le candidat peut perdre
  // le bénéfice de son travail sans s'en rendre compte. L'alerte vit donc dans le layout,
  // visible sur TOUTES les pages de l'espace, et pas seulement sur celle du dossier.
  const enModification = candidatures.find((item) => Boolean(item.donneesProjetTravail));

  return (
    <OperatorShell session={session} unreadCount={unreadCount} subventionStatut={subventionStatut} brand={brand}>
      {enModification ? (
        <p className="operator-auth-error">
          ⚠ Vous avez des modifications <strong>non déposées</strong> sur le dossier {enModification.numeroDossier}.
          Tant que vous ne les aurez pas déposées, c’est votre version précédente qui sera instruite.{' '}
          <Link href={`/candidatures/${enModification.documentId}/suivi`} className="operator-text-link">
            Terminer et déposer
          </Link>
        </p>
      ) : null}
      {children}
    </OperatorShell>
  );
}
