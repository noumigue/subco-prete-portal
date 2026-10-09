import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGestionDossierPieces } from '@/lib/gestion-api';
import { GestionPiecesDossier } from '@/components/gestion-pieces-dossier';
import { portalMediaUrl } from '@/lib/portal-media';

export const dynamic = 'force-dynamic';

// Consultation des SEULES pièces d'un dossier, ouverte à toute l'équipe (décision du
// 09/10/2026). Un évaluateur peut ainsi consulter les documents d'un dossier qui n'est pas
// le sien, sans rien voir de la notation : cette page n'affiche ni note, ni commentaire,
// ni verdict, ni nom d'évaluateur, et ne propose aucune action.
function jourHeure(v: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default async function PiecesDossierPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const vue = await getGestionDossierPieces(documentId);
  if (!vue) notFound();

  const numero = vue.numeroDossier || '—';
  const assistance = vue.assistance || [];

  return (
    <>
      <Link className="gx-back" href="/gestion/dossiers">← La file des dossiers</Link>
      <h1 className="gx-page-title">
        Pièces du dossier — {vue.organisation?.nom || '—'}{' '}
        <span className="gx-num" style={{ fontSize: 13, color: 'var(--muted-warm)' }}>{numero}</span>
      </h1>
      <p className="gx-page-sub">
        {[vue.organisation?.filiere, vue.organisation?.province, vue.statutLibelle].filter(Boolean).join(' · ') || 'Consultation'}
      </p>

      <div className="gx-flash">
        Lecture seule. Ces documents sont <b>confidentiels</b>{' '}et réservés à l&apos;instruction.
        La notation de ce dossier — fiches, notes, commentaires et consolidation — n&apos;est pas
        accessible depuis cette page.
      </div>

      <GestionPiecesDossier donnees={{ pieces: vue.pieces, autres: vue.autres }} />

      {assistance.length ? (
        <div className="gx-card">
          <div className="gx-block-title">
            Pièces reçues via l&apos;assistance<span className="gx-tot">{assistance.length} fichier(s)</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted-warm)', margin: '0 0 10px' }}>
            Envoyées par le candidat dans ses demandes d&apos;assistance. Celles marquées
            « non versée » ne figurent pas dans la liste des pièces ci-dessus.
          </p>
          {assistance.map((p) => (
            <div key={`${p.fileId}-${p.demandeDocumentId}`} style={{ borderTop: '1px solid var(--line-warm)', padding: '9px 0' }}>
              <div className="gx-cpl-row">
                {p.url ? (
                  <a className="gx-btn gx-btn-ghost gx-btn-sm" href={portalMediaUrl(p.url) || '#'} target="_blank" rel="noopener noreferrer" title={`Ouvrir « ${p.nom} »`}>⤓ {p.nom}</a>
                ) : <span className="gx-cpl-wait">Fichier indisponible</span>}
                <span style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{jourHeure(p.envoyeLe)}</span>
                {p.verseeComme.length ? (
                  <span className="gx-pill gx-pill-ok" style={{ fontSize: 11 }}>✓ versée : {p.verseeComme.join(' · ')}</span>
                ) : (
                  <span className="gx-pill gx-pill-comp" style={{ fontSize: 11 }}>non versée</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
