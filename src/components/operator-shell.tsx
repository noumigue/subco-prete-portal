'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { PortalRole, PortalSession } from '@/lib/portal-types';

type OperatorShellProps = {
  children: React.ReactNode;
  session: PortalSession;
  unreadCount: number;
};

const navItems = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icon: '📊' },
  { href: '/mon-organisation', label: 'Mon organisation', icon: '🏢' },
  { href: '/mes-candidatures', label: 'Mes candidatures', icon: '📄' },
  { href: '/ma-subvention', label: 'Ma subvention', icon: '🔒', lockedFor: 'candidat' as PortalRole },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/faq-documents', label: 'FAQ & documents', icon: '📚' },
  { href: '/assistance', label: 'Assistance', icon: '🛟' },
];

export function OperatorShell({ children, session, unreadCount }: OperatorShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="operator-shell">
      <div className={`operator-scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <header className="operator-topbar">
        <button type="button" className="operator-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          ☰
        </button>
        <div className="operator-brand">
          <span className="operator-brand-mark">SP</span>
          <span>SUBCO-PRETE<small>Portail operateur</small></span>
        </div>
        <div className="operator-topbar-right">
          <Link href="/assistance" className="operator-help-pill">🛟 Besoin d&apos;aide ?</Link>
          <Link href="/notifications" className="operator-bell" aria-label="Notifications">
            🔔
            {unreadCount > 0 ? <span className="operator-bell-dot">{unreadCount}</span> : null}
          </Link>
          <div className="operator-account-chip" title={session.orgName}>
            <span className="operator-avatar">{session.orgName.slice(0, 2).toUpperCase()}</span>
            <span className="operator-account-name">{session.orgName}</span>
            <span className="operator-account-caret">▾</span>
          </div>
        </div>
      </header>

      <div className="operator-app">
        <aside className={`operator-sidebar${open ? ' open' : ''}`}>
          <div className="operator-sidebar-scroll">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const locked = item.lockedFor && session.role === item.lockedFor;

              return locked ? (
                <div key={item.href} className="operator-nav-item is-locked" aria-disabled="true">
                  <span className="operator-nav-icon">{item.icon}</span>
                  <span>
                    {item.label}
                    <small>Disponible apres selection</small>
                  </span>
                </div>
              ) : (
                <Link key={item.href} href={item.href} className={`operator-nav-item${active ? ' is-active' : ''}`} onClick={() => setOpen(false)}>
                  <span className="operator-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="operator-sidebar-footer">
            <Link href="/mon-compte" className={`operator-nav-item${pathname === '/mon-compte' ? ' is-active' : ''}`} onClick={() => setOpen(false)}>
              <span className="operator-nav-icon">⚙️</span>
              <span>Mon compte</span>
            </Link>
            <Link href="/deconnexion" className="operator-nav-item operator-logout">
              <span className="operator-nav-icon">↩</span>
              <span>Se deconnecter</span>
            </Link>
          </div>
        </aside>

        <div className="operator-main-wrap">
          <main className="operator-main">{children}</main>
          <footer className="operator-foot">
            <a href="#">UGP PRETE</a>
            <a href="#">Aide</a>
            <a href="#">Mentions legales</a>
            <span className="operator-foot-fin">Finance par la Banque mondiale · Projet PRETE Nyunganira</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
