import Link from 'next/link';
import { getPortalCandidatures, getPortalOpenCalls } from '@/lib/portal-api';
import { requirePortalSession } from '@/lib/portal-auth';

type OpenCall = Awaited<ReturnType<typeof getPortalOpenCalls>>[number];

function formatDeadline(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

function resolveDashboardState(candidatures: Awaited<ReturnType<typeof getPortalCandidatures>>, openCall?: OpenCall) {
  const draft = candidatures.find((item) => item.statut?.code === 'brouillon');
  if (draft) return { eyebrow: 'État du parcours', label: 'Reprendre', href: `/candidatures/${draft.documentId}/formulaire`, note: 'Votre brouillon est disponible.', deadline: '' };

  const live = candidatures.find((item) => item.statut?.groupe === 'en_instruction');
  if (live) return { eyebrow: 'État du parcours', label: 'Suivre mon dossier', href: `/candidatures/${live.documentId}/suivi`, note: 'Votre dossier est en instruction.', deadline: '' };

  const rejected = candidatures.some((item) => item.statut?.code === 'non_retenu');
  if (openCall) {
    return {
      eyebrow: 'Appel à propositions ouvert',
      label: '+ Nouvelle candidature',
      href: '/candidatures/nouvelle',
      note: openCall.nom || (rejected ? 'Un nouvel appel est disponible.' : 'Vous pouvez commencer une candidature.'),
      deadline: formatDeadline(openCall.clotureLe),
    };
  }
  return { eyebrow: 'État du parcours', label: '', href: '', note: 'Aucun appel ouvert pour le moment.', deadline: '' };
}

export default async function DashboardPage() {
  const session = await requirePortalSession();
  const [candidatures, openCalls] = await Promise.all([getPortalCandidatures(), getPortalOpenCalls()]);
  const dashboardState = resolveDashboardState(candidatures, openCalls[0]);

  return (
    <div className="operator-page">
      <p className="operator-kicker">Tableau de bord</p>
      <h1>Bonjour, {session.orgName}</h1>
      <p className="operator-page-intro">Le portail lit votre état courant pour vous proposer la bonne action, sans bouton mort.</p>

      <section className="operator-card operator-card-highlight">
        <p className="operator-eyebrow">{dashboardState.eyebrow}</p>
        <h2>{dashboardState.note}</h2>
        {dashboardState.deadline ? <p className="operator-muted">Clôture des dépôts : {dashboardState.deadline}</p> : null}
        {dashboardState.href ? <Link href={dashboardState.href} className="operator-primary-btn inline">{dashboardState.label}</Link> : <p className="operator-muted">Le prochain appel sera publié depuis le CMS.</p>}
      </section>

      <div className="operator-grid-2">
        <section className="operator-card">
          <h3>Mes candidatures</h3>
          <p className="operator-muted">{candidatures.length} dossier(s) visible(s) dans votre espace.</p>
          <Link href="/mes-candidatures" className="operator-text-link">Voir le registre complet</Link>
        </section>
        <section className="operator-card">
          <h3>Ma subvention</h3>
          <p className="operator-muted">{session.role === 'beneficiaire' ? 'L’espace bénéficiaire est ouvert.' : 'Cette section reste verrouillée tant qu’une candidature n’est pas sélectionnée.'}</p>
        </section>
      </div>
    </div>
  );
}
