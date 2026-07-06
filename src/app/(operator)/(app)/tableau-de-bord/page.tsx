import Link from 'next/link';
import { getPortalCandidatures, getPortalOpenCalls } from '@/lib/portal-api';
import { requirePortalSession } from '@/lib/portal-auth';

function resolveDashboardState(candidatures: Awaited<ReturnType<typeof getPortalCandidatures>>, hasOpenCall: boolean) {
  const draft = candidatures.find((item) => item.statut?.code === 'brouillon');
  if (draft) return { label: 'Reprendre', href: `/candidatures/${draft.documentId}/formulaire`, note: 'Votre brouillon est disponible.' };

  const live = candidatures.find((item) => item.statut?.groupe === 'en_instruction');
  if (live) return { label: 'Suivre mon dossier', href: `/candidatures/${live.documentId}/suivi`, note: 'Votre dossier est en instruction.' };

  const rejected = candidatures.some((item) => item.statut?.code === 'non_retenu');
  if (hasOpenCall) return { label: '+ Nouvelle candidature', href: '/candidatures/nouvelle', note: rejected ? 'Un nouvel appel est disponible.' : 'Vous pouvez commencer une candidature.' };
  return { label: '', href: '', note: 'Aucun appel ouvert pour le moment.' };
}

export default async function DashboardPage() {
  const session = await requirePortalSession();
  const [candidatures, openCalls] = await Promise.all([getPortalCandidatures(), getPortalOpenCalls()]);
  const dashboardState = resolveDashboardState(candidatures, openCalls.length > 0);

  return (
    <div className="operator-page">
      <p className="operator-kicker">Tableau de bord</p>
      <h1>Bonjour, {session.orgName}</h1>
      <p className="operator-page-intro">Le portail lit votre etat courant pour vous proposer la bonne action, sans bouton mort.</p>

      <section className="operator-card operator-card-highlight">
        <p className="operator-eyebrow">Etat du parcours</p>
        <h2>{dashboardState.note}</h2>
        {dashboardState.href ? <Link href={dashboardState.href} className="operator-primary-btn inline">{dashboardState.label}</Link> : <p className="operator-muted">Le prochain appel sera publie depuis le CMS.</p>}
      </section>

      <div className="operator-grid-2">
        <section className="operator-card">
          <h3>Mes candidatures</h3>
          <p className="operator-muted">{candidatures.length} dossier(s) visible(s) dans votre espace.</p>
          <Link href="/mes-candidatures" className="operator-text-link">Voir le registre complet</Link>
        </section>
        <section className="operator-card">
          <h3>Ma subvention</h3>
          <p className="operator-muted">{session.role === 'beneficiaire' ? 'L espace beneficiaire est ouvert.' : 'Cette section reste verrouillee tant qu une candidature n est pas selectionnee.'}</p>
        </section>
      </div>
    </div>
  );
}
