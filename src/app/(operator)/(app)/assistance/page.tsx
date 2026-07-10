import Link from 'next/link';
import { getPortalDemandesAssistance } from '@/lib/portal-api';
import type { PortalDemandeAssistance } from '@/lib/portal-types';

function statutPill(statut?: string) {
  if (statut === 'resolue') return { label: '✓ Résolue', cls: 'pill-res' };
  if (statut === 'en_cours') return { label: '⏳ En cours', cls: 'pill-cours' };
  return { label: '● Ouverte', cls: 'pill-open' };
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function concerneLabel(d: PortalDemandeAssistance) {
  if (d.concerneCandidature?.numeroDossier) return { num: true, text: d.concerneCandidature.numeroDossier };
  if (d.concerneSubvention?.numeroConvention) return { num: true, text: d.concerneSubvention.numeroConvention };
  return { num: false, text: 'Question générale' };
}

function Row({ d }: { d: PortalDemandeAssistance }) {
  const pill = statutPill(d.statut);
  const concerne = concerneLabel(d);
  return (
    <Link href={`/assistance/${d.documentId}`} className="operator-assist-row">
      <div className="operator-assist-main">
        <p className="operator-assist-title">{d.objet}</p>
        <div className="operator-assist-info">
          <span className={`operator-pill ${pill.cls}`}>{pill.label}</span>
          {d.categorie?.libelle ? <span>{d.categorie.libelle}</span> : null}
          <span className={concerne.num ? 'operator-candidature-num' : ''}>{concerne.text}</span>
          <span className="operator-muted">maj {formatDate(d.updatedAt)}</span>
        </div>
      </div>
      <span className="operator-secondary-btn operator-btn-sm">Ouvrir</span>
    </Link>
  );
}

export default async function AssistancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cree = Array.isArray(params.cree) ? params.cree[0] : params.cree;
  const demandes = await getPortalDemandesAssistance();
  const enCours = demandes.filter((d) => d.statut !== 'resolue');
  const resolues = demandes.filter((d) => d.statut === 'resolue');

  return (
    <div className="operator-page">
      <div className="operator-page-head">
        <h1>Assistance</h1>
        <Link href="/assistance/nouvelle" className="operator-primary-btn inline">+ Nouvelle demande</Link>
      </div>
      <p className="operator-page-intro">Vos échanges avec l&apos;équipe du projet.</p>
      {cree ? <p className="operator-auth-note">Demande envoyée — un accusé vous a été adressé par e-mail.</p> : null}

      {demandes.length === 0 ? (
        <section className="operator-empty-state">
          <h2>Aucune demande pour le moment</h2>
          <p className="operator-muted">
            La réponse à votre question se trouve peut-être déjà dans la FAQ. Sinon, faites une demande : l&apos;équipe du projet vous répondra.
          </p>
          <div className="operator-empty-actions">
            <Link href="/faq-documents" className="operator-secondary-btn inline">Consulter la FAQ</Link>
            <Link href="/assistance/nouvelle" className="operator-primary-btn inline">+ Nouvelle demande</Link>
          </div>
        </section>
      ) : (
        <>
          <div className="operator-section-label">En cours <span className="operator-section-count">{enCours.length}</span></div>
          <div className="operator-list">
            {enCours.length === 0 ? <p className="operator-muted">Aucune demande en cours.</p> : enCours.map((d) => <Row key={d.documentId} d={d} />)}
          </div>
          {resolues.length > 0 ? (
            <>
              <div className="operator-section-label">Résolues <span className="operator-section-count">{resolues.length}</span></div>
              <div className="operator-list">
                {resolues.map((d) => <Row key={d.documentId} d={d} />)}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
