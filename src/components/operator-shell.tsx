'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { PortalSession } from '@/lib/portal-types';
import { OperatorNavIcon } from '@/components/operator-nav-icon';

// A6 — destination du « Besoin d'aide ? ». Livre : 'C' (mini-panneau).
// 'A' => lien direct vers Nouvelle demande, 'B' => lien vers la FAQ. Reversible en une ligne.
const HELP_DESTINATION: 'A' | 'B' | 'C' = 'C';

type OperatorShellProps = {
  children: React.ReactNode;
  session: PortalSession;
  unreadCount: number;
  // Statut de la subvention de l'operateur (null = aucune). Deverrouille « Ma subvention » (S1).
  subventionStatut?: string | null;
  // Logo de marque (icône pour la pastille du header). Repli « SP » si vide.
  brand?: { label: string; logoUrl: string | null; logoIconUrl: string | null };
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

export function OperatorShell({ children, session, unreadCount, subventionStatut, brand }: OperatorShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const subventionUnlocked = Boolean(subventionStatut);
  const isPreparation = subventionStatut === 'preparation';
  const brandMark = brand?.logoIconUrl || brand?.logoUrl || null;

  // Mini-panneau « Besoin d'aide ? » (A6, HELP_DESTINATION='C') : fermeture au clic exterieur + Echap.
  useEffect(() => {
    if (!helpOpen) return;
    function onDown(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setHelpOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [helpOpen]);

  return (
    <div className="operator-shell">
      <div className={`operator-scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <header className="operator-topbar">
        <button type="button" className="operator-burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <OperatorNavIcon name="menu" />
        </button>
        <div className="operator-brand">
          {brandMark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="brand-mark-img" src={brandMark} alt={brand?.label || 'SUBCO-PRETE'} />
          ) : (
            <span className="operator-brand-mark">SP</span>
          )}
          <span>SUBCO-PRETE<small>Portail opérateur</small></span>
        </div>
        <div className="operator-topbar-right">
          {HELP_DESTINATION === 'C' ? (
            <div className="operator-help-wrap" ref={helpRef}>
              <button type="button" className="operator-help-pill" onClick={() => setHelpOpen((v) => !v)} aria-expanded={helpOpen} aria-haspopup="menu">
                <OperatorNavIcon name="assistance" />
                <span>Besoin d&apos;aide ?</span>
              </button>
              {helpOpen ? (
                <div className="operator-help-pop" role="menu">
                  <Link href="/faq-documents" className="operator-help-item" role="menuitem" onClick={() => setHelpOpen(false)}>
                    <span className="operator-help-ic">📚</span>
                    <span><span className="operator-help-t">Consulter la FAQ</span><span className="operator-help-d">Réponses immédiates aux questions fréquentes</span></span>
                  </Link>
                  <Link href="/assistance/nouvelle" className="operator-help-item" role="menuitem" onClick={() => setHelpOpen(false)}>
                    <span className="operator-help-ic">🛟</span>
                    <span><span className="operator-help-t">Faire une demande d&apos;assistance</span><span className="operator-help-d">L&apos;équipe du projet vous répond</span></span>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href={HELP_DESTINATION === 'B' ? '/faq-documents' : '/assistance/nouvelle'} className="operator-help-pill">
              <OperatorNavIcon name="assistance" />
              <span>Besoin d&apos;aide ?</span>
            </Link>
          )}
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
