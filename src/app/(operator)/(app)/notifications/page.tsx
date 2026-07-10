import Link from 'next/link';
import { markAllNotificationsReadAction, markNotificationReadAction } from '../../actions';
import { getPortalNotifications } from '@/lib/portal-api';

function channelLabel(canal?: string) {
  if (canal === 'both') return 'SMS · e-mail';
  if (canal === 'sms') return 'SMS';
  return 'e-mail';
}

function formatDate(value?: string) {
  if (!value) return 'Date à confirmer';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtre = (Array.isArray(params.filtre) ? params.filtre[0] : params.filtre) === 'non-lues' ? 'unread' : 'all';
  const notifications = await getPortalNotifications();
  const unreadCount = notifications.filter((item) => !item.lu).length;
  const shown = filtre === 'unread' ? notifications.filter((item) => !item.lu) : notifications;

  return (
    <div className="operator-page">
      <p className="operator-kicker">Notifications</p>
      <h1>Journal global</h1>
      <p className="operator-page-intro">Tous les messages e-mail et SMS envoyés par la plateforme. Les accusés officiels partent toujours par e-mail et SMS.</p>

      <div className="operator-filterbar">
        <Link href="/notifications" className={`operator-chip${filtre === 'all' ? ' is-on' : ''}`}>Toutes</Link>
        <Link href="/notifications?filtre=non-lues" className={`operator-chip${filtre === 'unread' ? ' is-on' : ''}`}>Non lues{unreadCount > 0 ? ` (${unreadCount})` : ''}</Link>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction} className="operator-filterbar-right">
            <button type="submit" className="operator-secondary-btn operator-btn-sm">Tout marquer comme lu</button>
          </form>
        ) : null}
      </div>

      <section className="operator-card">
        <div className="operator-list">
          {shown.length === 0 ? (
            <p className="operator-muted">{filtre === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification pour le moment.'}</p>
          ) : shown.map((item) => (
            <article key={item.documentId} className={`operator-list-row${item.lu ? '' : ' is-unread'}`}>
              <div>
                <div className="operator-notif-meta">
                  <span className="operator-notif-channel">{channelLabel(item.canal)}</span>
                  <span className="operator-muted">{formatDate(item.envoyeLe)}</span>
                </div>
                <h3>{item.sujet}</h3>
                <p className="operator-muted">{item.corps}</p>
                {item.candidature?.documentId ? (
                  <Link href={`/candidatures/${item.candidature.documentId}/suivi`} className="operator-text-link">Voir le dossier →</Link>
                ) : null}
              </div>
              {!item.lu ? (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="documentId" value={item.documentId} />
                  <input type="hidden" name="filter" value={filtre} />
                  <button type="submit" className="operator-link-button">Marquer comme lu</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
