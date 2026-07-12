import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getFooterLinks, getSiteNavigation } from '@/lib/strapi-public';
import { LANG_TOGGLE_ENABLED } from '@/lib/site-config';
import './globals.css';

const appFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-app',
});

export const metadata: Metadata = {
  title: 'SUBCO PRETE',
  description: 'Portail de subventions de contrepartie PRETE',
  icons: {
    icon: '/subco-prete-icon.png',
    shortcut: '/subco-prete-icon.png',
    apple: '/subco-prete-icon.png',
  },
};

const footerColumns = [
  { key: 'programme', title: 'Le programme' },
  { key: 'candidater', title: 'Candidater' },
  { key: 'aide', title: 'Aide & recours' },
] as const;

type HeaderNavItem = {
  href: string;
  label: string;
  className?: string;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get('x-pathname') || '/';
  const operatorRoutes = [
    '/connexion',
    '/inscription',
    '/verifier-email',
    '/mot-de-passe-oublie',
    '/reinitialiser',
    '/tableau-de-bord',
    '/mes-candidatures',
    '/candidatures',
    '/notifications',
    '/faq-documents',
    '/assistance',
    '/mon-organisation',
    '/mon-compte',
    '/ma-subvention',
    '/deconnexion',
    // Espace de gestion (back-office M5) : identité visuelle propre, sans chrome public.
    '/gestion',
  ];
  const isOperatorRoute = operatorRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const cookieStore = await cookies();
  const language = cookieStore.get('subco-lang')?.value === 'rn' ? 'rn' : 'fr';
  const [cmsFooterLinks, siteNavigation] = await Promise.all([getFooterLinks(), getSiteNavigation()]);
  const footerLinks = cmsFooterLinks;
  const supportLabel = language === 'rn'
    ? siteNavigation?.supportLabelRn || ''
    : siteNavigation?.supportLabelFr || '';
  const supportUrl = siteNavigation?.supportUrl || '';
  const brandLabel = siteNavigation?.brandLabel || 'SUBCO PRETE';
  const navItems: HeaderNavItem[] = [
    { href: '/#home-top', label: 'Accueil' },
    { href: '/#home-mechanism-band', label: 'Le Mécanisme' },
    { href: '/#home-value-chains', label: 'Chaînes de valeur' },
    { href: '/#home-infrastructure-band', label: 'Infrastructures' },
    { href: '/actualites', label: 'Actualités' },
  ];

  return (
    <html lang={language} className={appFont.variable}>
      <body suppressHydrationWarning>
        {isOperatorRoute ? null : (
          <>
            <div className="site-topbar">
              <div className="container topbar-wrap">
                <span>Programme PRETE · Subventions de contrepartie</span>
                <div className="topbar-links">
                  {supportLabel && supportUrl ? <Link href={supportUrl}>{supportLabel}</Link> : null}
                  {/* Porte operateur (G1) : lien texte plat dans la top bar, apres « Support / Contact ».
                      Crochets + info-bulle « Operateur » ; ouvre un nouvel onglet (comme la porte gestion). */}
                  <Link href="/connexion" className="topbar-login" title="Opérateur" target="_blank" rel="noopener">[Se connecter]</Link>
                  {/* Bascule FR/KI masquee tant que le Kirundi n'est pas operationnel (section 17). */}
                  {LANG_TOGGLE_ENABLED ? (
                    <span className="language-switch" aria-label="Choix de langue">
                      <Link href="/lang/fr" hrefLang="fr" aria-current={language === 'fr' ? 'true' : undefined}>FR</Link>
                      <span aria-hidden="true">|</span>
                      <Link href="/lang/rn" hrefLang="rn" aria-current={language === 'rn' ? 'true' : undefined}>KI</Link>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <header className="site-header">
              <div className="container nav-wrap">
                <Link href="/" className="brand">{brandLabel}</Link>
                <nav className="main-nav">
                  {navItems.map((item) => (
                    item.href.startsWith('/#') ? (
                      <a key={item.href} href={item.href} className={item.className}>
                        {item.label}
                      </a>
                    ) : (
                      <Link key={item.href} href={item.href} className={item.className}>
                        {item.label}
                      </Link>
                    )
                  ))}
                  <Link href="/candidature" className="btn primary nav-cta">Candidater</Link>
                </nav>
              </div>
            </header>
          </>
        )}
        {children}
        {isOperatorRoute ? null : (
          <footer className="site-footer">
            <div className="container footer-wrap">
              <div className="footer-brand">
                <p className="footer-brand-name">SUBCO-PRETE</p>
                <p className="footer-tagline">
                  La plateforme des subventions de contrepartie du PRETE : s’informer, vérifier son éligibilité,
                  candidater, puis suivre et gérer sa subvention.
                </p>
              </div>
              {footerColumns.map((column) => (
                <div key={column.key} className="footer-links">
                  <strong>{column.title}</strong>
                  {footerLinks
                    .filter((item) => item.group === column.key)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((item) => {
                      const url = item.url || '/';
                      const isExternal = /^https?:\/\//i.test(url);
                      const isOperator = operatorRoutes.some(
                        (route) => url === route || url.startsWith(`${route}/`),
                      );
                      const opensNewTab = isExternal || isOperator;
                      const arrow = opensNewTab ? (
                        <span className="footer-newtab" aria-hidden="true">↗</span>
                      ) : null;
                      return isExternal ? (
                        <a
                          key={`${column.key}-${item.label}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.label}
                          {arrow}
                        </a>
                      ) : (
                        <Link
                          key={`${column.key}-${item.label}`}
                          href={url}
                          {...(isOperator ? { target: '_blank', rel: 'noopener' } : {})}
                        >
                          {item.label}
                          {arrow}
                        </Link>
                      );
                    })}
                  {/* Porte gestion (G2) : lien sobre en fin de colonne « Le programme », pres du lien UGP.
                      Ouvre un nouvel onglet, comme « Espace operateur ». */}
                  {column.key === 'programme' ? (
                    <Link href="/gestion/connexion" target="_blank" rel="noopener">
                      Espace de gestion
                      <span className="footer-newtab" aria-hidden="true">↗</span>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="footer-bottom">
              <div className="container footer-bottom-inner">
                <p className="footer-funding">
                  <strong>Financé par la Banque mondiale</strong> · Mis en œuvre par l’UGP
                </p>
                <div className="footer-legal">
                  <span>© {new Date().getFullYear()} SUBCO-PRETE — Projet PRETE Nyunganira</span>
                  {footerLinks
                    .filter((item) => item.group === 'legal')
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((item) => (
                      <Link key={`legal-${item.label}`} href={item.url || '/'}>
                        {item.label}
                      </Link>
                    ))}
                  {LANG_TOGGLE_ENABLED ? (
                    <span className="footer-lang">
                      <Link href="/lang/fr">FR</Link>
                      <span aria-hidden="true">·</span>
                      <Link href="/lang/rn">KI</Link>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </footer>
        )}
      </body>
    </html>
  );
}
