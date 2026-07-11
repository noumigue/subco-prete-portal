import type { GestionActe } from '@/lib/portal-types';

// Journal du dossier (traçabilité 8.1.1) : actes horodatés et nominatifs, append-only.
export function GestionJournal({ journal }: { journal: GestionActe[] }) {
  return (
    <div className="gx-card gx-journal">
      <div className="gx-block-title">Journal du dossier (traçabilité 8.1.1)</div>
      {journal.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: 0 }}>Aucun acte enregistré.</p>
      ) : (
        journal.map((j, i) => (
          <div className="gx-jrow" key={i}>
            <span className="gx-jd">{j.date ? new Date(j.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
            <span className="gx-ja">{j.auteur}</span>
            <span>{j.texte}</span>
          </div>
        ))
      )}
    </div>
  );
}
