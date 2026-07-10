'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { PortalSession } from '@/lib/portal-types';
import { OperatorNavIcon } from '@/components/operator-nav-icon';

type OperatorShellProps = {
  children: React.ReactNode;
  session: PortalSession;
  unreadCount: number;
  // Statut de la subvention de l'operateur (null = aucune). Deverrouille « Ma subvention » (S1).
  subventionStatut?: string | null;
};

// « Ma subvention » (Lot 2) : verrouillee tant qu'aucune subvention n'existe ; deverrouillee
// des la selection (S1), avec sous-items deplies. Badge « Preparation » tant que statut preparation.
const navItems = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard' },
  { href: '/mon-organisation', label: 'Mon organisation', icon: 'organisation' },
  { href: '/mes-candidatures', label: 'Mes candidatures', icon: 'candidatures' },
  { href: '/ma-subvention', label: 'Ma subvention', icon: 'subvention', isSubvention: true },
  { href: '/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/faq-documents', label: 'FAQ & documents', icon: 'faq' },
  { href: '/assistance', label: 'Assistance', icon: 'assistance' },
];

const subventionSubItems = [
  { href: '/ma-subvention/convention', label: 'Ma convention' },
  { href: '/ma-subvention/suivi', label: 'Suivi du projet' },
  { href: '/ma-subvention/decaissements', label: 'Décaissements' },
];

export function OperatorShell({ children, session, unreadCount, subventionStatut }: OperatorShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const subventionUnlocked = Boolean(subventionStatut);
  const isPreparation = subventionStatut === 'preparation';

  return (
    <div className="operator-shell">
      <div className={`operator-scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <header className="operator-topbar">
        <button type="button" className="operator-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <OperatorNavIcon name="menu" />
        </button>
        <div className="operator-brand">
          <span className="operator-brand-mark">SP</span>
          <span>SUBCO-PRETE<small>Portail opérateur</small></span>
        </div>
        <div className="operator-topbar-right">
          <Link href="/assistance" className="operator-help-pill">
            <OperatorNavIcon name="assistance" />
            <span>Besoin d&apos;aide ?</span>
          </Link>
          <Link href="/notifications" className="operator-bell" aria-label="Notifications">
            <OperatorNavIcon name="notifications" />
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

              if (item.isSubvention) {
                if (!subventionUnlocked) {
                  return (
                    <div key={item.href} className="operator-nav-item is-locked" aria-disabled="true" title="Disponible après sélection">
                      <span className="operator-nav-icon"><OperatorNavIcon name={item.icon} /></span>
                      <span>
                        {item.label}
                        <small>Disponible après sélection</small>
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={item.href}>
                    <Link href={item.href} className={`operator-nav-item${active ? ' is-active' : ''}`} onClick={() => setOpen(false)}>
                      <span className="operator-nav-icon"><OperatorNavIcon name={item.icon} /></span>
                      <span>{item.label}</span>
                      {isPreparation ? <span className="operator-nav-badge">Préparation</span> : null}
                    </Link>
                    <div className="operator-subnav">
                      {subventionSubItems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`operator-subnav-item${pathname === sub.href ? ' is-active' : ''}`}
                          onClick={() => setOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link key={item.href} href={item.href} className={`operator-nav-item${active ? ' is-active' : ''}`} onClick={() => setOpen(false)}>
                  <span className="operator-nav-icon"><OperatorNavIcon name={item.icon} /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="operator-sidebar-footer">
            <Link href="/mon-compte" className={`operator-nav-item${pathname === '/mon-compte' ? ' is-active' : ''}`} onClick={() => setOpen(false)}>
              <span className="operator-nav-icon"><OperatorNavIcon name="account" /></span>
              <span>Mon compte</span>
            </Link>
            <Link href="/deconnexion" className="operator-nav-item operator-logout">
              <span className="operator-nav-icon"><OperatorNavIcon name="logout" /></span>
              <span>Se déconnecter</span>
            </Link>
          </div>
        </aside>

        <div className="operator-main-wrap">
          <main className="operator-main">{children}</main>
          <footer className="operator-foot">
            <a href="#">UGP PRETE</a>
            <a href="#">Aide</a>
            <a href="#">Mentions légales</a>
            <span className="operator-foot-fin">Financé par la Banque mondiale · Projet PRETE Nyunganira</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
