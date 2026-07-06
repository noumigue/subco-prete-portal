import { OperatorShell } from '@/components/operator-shell';
import { requirePortalSession } from '@/lib/portal-auth';
import { getPortalNotifications } from '@/lib/portal-api';

export default async function OperatorAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requirePortalSession();
  const notifications = await getPortalNotifications();
  const unreadCount = notifications.filter((item) => !item.lu).length;

  return <OperatorShell session={session} unreadCount={unreadCount}>{children}</OperatorShell>;
}
