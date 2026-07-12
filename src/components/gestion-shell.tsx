'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PortalSession } from '@/lib/portal-types';
import { logoutGestionAction } from '@/app/(gestion)/actions';

type GestionShellProps = {
  children: React.ReactNode;
  session: PortalSession;
  pendingCount: number;
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

export function GestionShell({ children, session, pendingCount }: GestionShellProps) {
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
          <form action={logoutGestionAction}>
            <button type="submit" className="gx-logout">Déconnexion</button>
          </form>
        </div>
      </header>

      <nav className="gx-side">
        <div className="gx-nav-scroll">
          {isComite ? (
            /* Comité : accès réduit au dossier de séance (F2, lecture). */
            <Link className={`gx-nav-item${active('/gestion/seance')}`} href="/gestion/seance">
              <span className="gx-ic">🏛️</span>Dossier de séance
            </Link>
          ) : (
            <>
              <Link className={`gx-nav-item${isFileActive ? ' active' : ''}`} href="/gestion/dossiers">
                <span className="gx-ic">🗂️</span>File des dossiers
                {isUgp && pendingCount > 0 ? <span className="gx-nav-badge">{pendingCount}</span> : null}
              </Link>
              {isUgp ? (
                <>
                  <Link className={`gx-nav-item${active('/gestion/appels')}`} href="/gestion/appels"><span className="gx-ic">📢</span>Appels</Link>
                  <Link className={`gx-nav-item${active('/gestion/rapport')}`} href="/gestion/rapport"><span className="gx-ic">📊</span>Rapport &amp; classement</Link>
                  <Link className={`gx-nav-item${active('/gestion/decisions')}`} href="/gestion/decisions"><span className="gx-ic">🗳️</span>Décisions du Comité</Link>
                  <Link className={`gx-nav-item${active('/gestion/publication')}`} href="/gestion/publication"><span className="gx-ic">📣</span>Publication</Link>
                  <span className="gx-nav-item disabled"><span className="gx-ic">🎯</span><span>Subventions<span className="gx-phase-note">Phase 3</span></span></span>
                  <span className="gx-nav-item disabled"><span className="gx-ic">🛟</span><span>Assistance<span className="gx-phase-note">Phase 4</span></span></span>
                </>
              ) : (
                <>
                  <Link className={`gx-nav-item${active('/gestion/evaluations')}`} href="/gestion/evaluations"><span className="gx-ic">📝</span>Mes évaluations</Link>
                  <Link className={`gx-nav-item${active('/gestion/rapport')}`} href="/gestion/rapport"><span className="gx-ic">📊</span>Rapport &amp; classement</Link>
                  <span className="gx-nav-item disabled"><span className="gx-ic">🛟</span><span>Assistance<span className="gx-phase-note">Phase 4</span></span></span>
                </>
              )}
            </>
          )}
        </div>
        <div className="gx-nav-footer">
          <Link className="gx-nav-item" style={{ fontSize: 13, color: 'var(--muted-warm)' }} href="/gestion/mon-compte">
            <span className="gx-ic">⚙️</span>Mon compte
          </Link>
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
