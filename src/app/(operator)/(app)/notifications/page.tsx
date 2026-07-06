import { markNotificationReadAction } from '../../actions';
import { getPortalNotifications } from '@/lib/portal-api';

export default async function NotificationsPage() {
  const notifications = await getPortalNotifications();

  return (
    <div className="operator-page">
      <p className="operator-kicker">Notifications</p>
      <h1>Journal global</h1>
      <section className="operator-card">
        <div className="operator-list">
          {notifications.length === 0 ? <p className="operator-muted">Aucune notification pour le moment.</p> : notifications.map((item) => (
            <article key={item.documentId} className={`operator-list-row${item.lu ? '' : ' is-unread'}`}>
              <div>
                <h3>{item.sujet}</h3>
                <p>{item.canal?.toUpperCase()} · {item.envoyeLe || 'Date a confirmer'}</p>
                <p className="operator-muted">{item.corps}</p>
              </div>
              {!item.lu ? (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="documentId" value={item.documentId} />
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
