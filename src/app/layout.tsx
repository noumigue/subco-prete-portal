import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getFooterLinks, getSiteNavigation, type NavigationLinkItem, type SiteLanguage } from '@/lib/strapi-public';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUBCO PRETE',
  description: 'Portail de subventions de contrepartie PRETE',
  icons: {
    icon: '/subco-prete-icon.png',
    shortcut: '/subco-prete-icon.png',
    apple: '/subco-prete-icon.png',
  },
};

const footerGroups = [
  { key: 'assistance', title: 'Assistance' },
  { key: 'institutional', title: 'Liens institutionnels' },
  { key: 'resources', title: 'Ressources' },
] as const;
function normalizeNavItems(items: NavigationLinkItem[] | undefined) {
  return (items || [])
    .filter((item) => item.isVisible !== false && item.url)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function localizedLabel(item: NavigationLinkItem | { labelFr?: string; labelRn?: string }, language: SiteLanguage) {
  return language === 'rn' ? item.labelRn || '' : item.labelFr || '';
}

function normalizeMenuUrl(url?: string) {
  if (!url) return '/';
  if (url === '/candidature/bis' || url === '/candidature/bis/') return '/candidature';
  return url;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language = cookieStore.get('subco-lang')?.value === 'rn' ? 'rn' : 'fr';
  const [cmsFooterLinks, siteNavigation] = await Promise.all([getFooterLinks(), getSiteNavigation()]);
  const footerLinks = cmsFooterLinks;
  const primaryNav = normalizeNavItems(siteNavigation?.primaryItems);
  const newsNav = normalizeNavItems(siteNavigation?.newsItems);
  const supportLabel = language === 'rn'
    ? siteNavigation?.supportLabelRn || ''
    : siteNavigation?.supportLabelFr || '';
  const supportUrl = siteNavigation?.supportUrl || '';
  const newsLabel = language === 'rn'
    ? siteNavigation?.newsLabelRn || ''
    : siteNavigation?.newsLabelFr || '';
  const ctaLabel = language === 'rn'
    ? siteNavigation?.ctaLabelRn || ''
    : siteNavigation?.ctaLabelFr || '';
  const ctaUrl = siteNavigation?.ctaUrl || '';
  const brandLabel = siteNavigation?.brandLabel || 'SUBCO PRETE';

  return (
    <html lang={language}>
      <body suppressHydrationWarning>
        <div className="site-topbar">
          <div className="container topbar-wrap">
            <span>Programme PRETE · Subventions de contrepartie</span>
            <div className="topbar-links">
              {supportLabel && supportUrl ? <Link href={supportUrl}>{supportLabel}</Link> : null}
              <span className="language-switch" aria-label="Choix de langue">
                <Link href="/lang/fr" hrefLang="fr" aria-current={language === 'fr' ? 'true' : undefined}>FR</Link>
                <span aria-hidden="true">|</span>
                <Link href="/lang/rn" hrefLang="rn" aria-current={language === 'rn' ? 'true' : undefined}>KI</Link>
              </span>
            </div>
          </div>
        </div>
        <header className="site-header">
          <div className="container nav-wrap">
            <Link href="/" className="brand">{brandLabel}</Link>
            <nav className="main-nav">
            {primaryNav.map((item) => (
                <Link key={`${item.url}-${item.sortOrder || 0}`} href={normalizeMenuUrl(item.url)}>
                  {localizedLabel(item, language)}
                </Link>
              ))}
              {newsLabel && newsNav.length > 0 ? (
                <div className="nav-dropdown">
                  <Link href={newsNav[0]?.url || '/actualites'} className="nav-dropdown-trigger">{newsLabel}</Link>
                  <div className="nav-dropdown-menu">
                    {newsNav.map((item) => (
                    <Link key={`${item.url}-${item.sortOrder || 0}`} href={normalizeMenuUrl(item.url)}>
                      {localizedLabel(item, language)}
                    </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {ctaLabel && ctaUrl ? <Link href={normalizeMenuUrl(ctaUrl)} className="btn primary nav-cta">{ctaLabel}</Link> : null}
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container footer-wrap">
            <div>
              <p>© {new Date().getFullYear()} SUBCO PRETE</p>
              <p>Plateforme d&apos;information et de soumission</p>
            </div>
            {footerGroups.map((group) => (
              <div key={group.key} className="footer-links">
                <strong>{group.title}</strong>
                {footerLinks
                  .filter((item) => item.group === group.key)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((item) => (
                    <Link key={`${group.key}-${item.label}`} href={item.url || '/'}>
                      {item.label}
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}
