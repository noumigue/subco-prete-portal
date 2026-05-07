import Link from 'next/link';
import { getCalls } from '@/lib/strapi-public';

function toDateLabel(value?: string) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
}

export default async function CallsListPage() {
  const calls = await getCalls();

  return (
    <main className="section">
      <div className="container">
        <h1>Appels à propositions</h1>
        <div className="grid three" style={{ marginTop: 16 }}>
          {calls.map((item) => (
            <article key={item.id} className="card">
              <span className={`badge ${item.callStatus || 'draft'}`}>{item.callStatus || 'draft'}</span>
              <h3>{item.title}</h3>
              <p>{item.summary || 'Résumé en cours de publication.'}</p>
              <p className="meta">Clôture: {toDateLabel(item.deadlineDate)}</p>
              {item.slug ? <p className="meta"><Link href={`/appels/${item.slug}`}>Voir le détail</Link></p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
