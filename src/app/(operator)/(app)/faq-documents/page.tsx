import { getPortalResourceDocuments, getPortalTypePieces } from '@/lib/portal-api';
import { mediaUrl } from '@/lib/strapi-public';

export default async function FaqDocumentsPage() {
  const [typePieces, documents] = await Promise.all([getPortalTypePieces(), getPortalResourceDocuments()]);

  return (
    <div className="operator-page">
      <p className="operator-kicker">FAQ & documents</p>
      <h1>Preparation de dossier</h1>
      <div className="operator-grid-2">
        <section className="operator-card">
          <h2>Pieces Annexe 9</h2>
          <ul className="operator-bullet-list">
            {typePieces.map((item) => (
              <li key={item.documentId}>{item.libelle} · {item.groupe} · {item.exigence}</li>
            ))}
          </ul>
        </section>
        <section className="operator-card">
          <h2>Documents utiles</h2>
          <ul className="operator-bullet-list">
            {documents.map((item) => {
              const fileUrl = mediaUrl(item.file);
              return (
                <li key={`${item.id}-${item.title}`}>
                  {fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer">{item.title}</a> : item.title}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
