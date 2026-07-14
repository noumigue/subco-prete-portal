'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PortalSession } from '@/lib/portal-types';
import { logoutGestionAction } from '@/app/(gestion)/actions';
import { GestionNavIcon } from '@/components/gestion-nav-icon';

type GestionShellProps = {
  children: React.ReactNode;
  session: PortalSession;
  pendingCount: number;
  assistCount?: number;
};

// Metadonnees de role : nom affiche (session.orgName sert de nom de personne pour les
// comptes internes), tag, initiales, libelle du chip.
const ROLE_META: Record<string, { tag: string; rtag: string }> = {
  instructeur: { tag: 'instructeur', rtag: 'INSTRUCTEUR · Cabinet' },
  ugp: { tag: 'ugp', rtag: 'UGP · Validation' },
  comite: { tag: 'comite', rtag: 'COMITÉ · Lecture' },
};

function initials(nom: string) {
  const parts = nom.split(/[\s.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'SP';
}

export function GestionShell({ children, session, pendingCount, assistCount = 0 }: GestionShellProps) {
  const pathname = usePathname();
  const isFileActive = pathname.startsWith('/gestion/dossiers');
  const meta = ROLE_META[session.role] || ROLE_META.instructeur;
  const isUgp = session.role === 'ugp';
  const isComite = session.role === 'comite';
  const active = (p: string) => (pathname.startsWith(p) ? ' active' : '');

  return (
    <div className="gx gx-app">
      <header className="gx-top">
        <div className="gx-brand">
          <span className="gx-mark">SP</span>
          <span>SUBCO-PRETE<small>Espace de gestion</small></span>
        </div>
        <div className="gx-head-right">
          <div className={`gx-rolechip ${meta.tag}`}>
            <span className="gx-avatar">{initials(session.orgName)}</span>
            <span>{session.orgName}<span className="gx-rtag">{meta.rtag}</span></span>
          </div>
          {/* Mobile uniquement : la barre latérale (qui porte « Se déconnecter ») est
              masquée sous 860px — on garde donc une sortie dans le bandeau. */}
          <form action={logoutGestionAction} className="gx-logout-mobile">
            <button type="submit" className="gx-logout">Se déconnecter</button>
          </form>
        </div>
      </header>

      <nav className="gx-side">
        <div className="gx-nav-scroll">
          {isComite ? (
            /* Comité : accès réduit au dossier de séance (F2, lecture). */
            <Link className={`gx-nav-item${active('/gestion/seance')}`} href="/gestion/seance">
              <span className="gx-ic"><GestionNavIcon name="seance" /></span>Dossier de séance
            </Link>
          ) : (
            <>
              <Link className={`gx-nav-item${isFileActive ? ' active' : ''}`} href="/gestion/dossiers">
                <span className="gx-ic"><GestionNavIcon name="dossiers" /></span>File des dossiers
                {isUgp && pendingCount > 0 ? <span className="gx-nav-badge">{pendingCount}</span> : null}
              </Link>
              {isUgp ? (
                <>
                  <Link className={`gx-nav-item${active('/gestion/appels')}`} href="/gestion/appels"><span className="gx-ic"><GestionNavIcon name="appels" /></span>Appels</Link>
                  <Link className={`gx-nav-item${active('/gestion/rapport')}`} href="/gestion/rapport"><span className="gx-ic"><GestionNavIcon name="rapport" /></span>Rapport &amp; classement</Link>
                  <Link className={`gx-nav-item${active('/gestion/decisions')}`} href="/gestion/decisions"><span className="gx-ic"><GestionNavIcon name="decisions" /></span>Décisions du Comité</Link>
                  <Link className={`gx-nav-item${active('/gestion/publication')}`} href="/gestion/publication"><span className="gx-ic"><GestionNavIcon name="publication" /></span>Publication</Link>
                  <Link className={`gx-nav-item${active('/gestion/subventions')}`} href="/gestion/subventions"><span className="gx-ic"><GestionNavIcon name="subventions" /></span>Subventions</Link>
                  <Link className={`gx-nav-item${active('/gestion/assistance')}`} href="/gestion/assistance"><span className="gx-ic"><GestionNavIcon name="assistance" /></span>Assistance{assistCount > 0 ? <span className="gx-nav-badge">{assistCount}</span> : null}</Link>
                  <Link className={`gx-nav-item${active('/gestion/non-objection')}`} href="/gestion/non-objection"><span className="gx-ic"><GestionNavIcon name="nonobjection" /></span>Non-objection</Link>
                  <Link className={`gx-nav-item${active('/gestion/se')}`} href="/gestion/se"><span className="gx-ic"><GestionNavIcon name="se" /></span>Suivi-évaluation</Link>
                  <Link className={`gx-nav-item${active('/gestion/administration')}`} href="/gestion/administration"><span className="gx-ic"><GestionNavIcon name="admin" /></span>Administration</Link>
                </>
              ) : (
                <>
                  <Link className={`gx-nav-item${active('/gestion/evaluations')}`} href="/gestion/evaluations"><span className="gx-ic"><GestionNavIcon name="evaluations" /></span>Mes évaluations</Link>
                  <Link className={`gx-nav-item${active('/gestion/rapport')}`} href="/gestion/rapport"><span className="gx-ic"><GestionNavIcon name="rapport" /></span>Rapport &amp; classement</Link>
                  <Link className={`gx-nav-item${active('/gestion/subventions')}`} href="/gestion/subventions"><span className="gx-ic"><GestionNavIcon name="subventions" /></span>Subventions<span className="gx-phase-note" style={{ marginLeft: 6 }}>Suivi technique</span></Link>
                  <Link className={`gx-nav-item${active('/gestion/assistance')}`} href="/gestion/assistance"><span className="gx-ic"><GestionNavIcon name="assistance" /></span>Assistance{assistCount > 0 ? <span className="gx-nav-badge">{assistCount}</span> : null}</Link>
                  <Link className={`gx-nav-item${active('/gestion/non-objection')}`} href="/gestion/non-objection"><span className="gx-ic"><GestionNavIcon name="nonobjection" /></span>Non-objection<span className="gx-phase-note" style={{ marginLeft: 6 }}>Lecture</span></Link>
                  <Link className={`gx-nav-item${active('/gestion/se')}`} href="/gestion/se"><span className="gx-ic"><GestionNavIcon name="se" /></span>Suivi-évaluation</Link>
                  <Link className={`gx-nav-item${active('/gestion/administration')}`} href="/gestion/administration"><span className="gx-ic"><GestionNavIcon name="admin" /></span>Administration<span className="gx-phase-note" style={{ marginLeft: 6 }}>Annuaire · sécurité</span></Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="gx-nav-footer">
          <Link className="gx-nav-item" href="/gestion/mon-compte">
            <span className="gx-ic"><GestionNavIcon name="account" /></span>Mon compte
          </Link>
          <form action={logoutGestionAction}>
            <button type="submit" className="gx-nav-item gx-nav-logout">
              <span className="gx-ic"><GestionNavIcon name="logout" /></span>Se déconnecter
            </button>
          </form>
        </div>
      </nav>

      <main className="gx-content">{children}</main>

      <footer className="gx-foot">
        <span>UGP PRETE · Espace de gestion</span>
        <span className="gx-fin">Financé par la Banque mondiale · Projet PRETE Nyunganira</span>
      </footer>
    </div>
  );
}
