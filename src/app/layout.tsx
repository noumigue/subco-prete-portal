import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getFooterLinks, getSiteNavigation } from '@/lib/strapi-public';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language = cookieStore.get('subco-lang')?.value === 'rn' ? 'rn' : 'fr';
  const [cmsFooterLinks, siteNavigation] = await Promise.all([getFooterLinks(), getSiteNavigation()]);
  const footerLinks = cmsFooterLinks;
  const supportLabel = language === 'rn'
    ? siteNavigation?.supportLabelRn || ''
    : siteNavigation?.supportLabelFr || '';
  const supportUrl = siteNavigation?.supportUrl || '';
  const brandLabel = siteNavigation?.brandLabel || 'SUBCO PRETE';
  const navItems = [
    { href: '/#home-top', label: 'Accueil' },
    { href: '/#home-mechanism-band', label: 'Le Mécanisme' },
    { href: '/#home-value-chains', label: 'Chaînes de valeur' },
    { href: '/#home-infrastructure-band', label: 'Infrastructures' },
    { href: '/actualites', label: 'Actualités' },
  ];

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
