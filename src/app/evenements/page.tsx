import Link from 'next/link';
import { getEvents } from '@/lib/strapi-public';

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

export default async function EventsListPage() {
  const events = await getEvents();

  return (
    <main className="section">
      <div className="container">
        <h1>Événements</h1>
        <div className="grid three" style={{ marginTop: 16 }}>
          {events.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.title}</h3>
              <p>{toDateLabel(item.eventDate)} · {item.location || 'Lieu à confirmer'}</p>
              {item.slug ? <p className="meta"><Link href={`/evenements/${item.slug}`}>Voir le détail</Link></p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
