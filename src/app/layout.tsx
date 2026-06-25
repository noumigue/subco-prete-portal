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

const fallbackFooterLinks = [
  { label: 'FAQ', url: '/candidature', group: 'assistance', sortOrder: 1 },
  { label: 'Poser une question', url: '/candidature', group: 'assistance', sortOrder: 2 },
  { label: 'Réclamations et recours', url: '/candidature', group: 'assistance', sortOrder: 3 },
  { label: 'Contact', url: '/candidature', group: 'assistance', sortOrder: 4 },
  { label: 'Support plateforme', url: '/candidature', group: 'assistance', sortOrder: 5 },
  { label: 'PRETE / NYUNGANIRA', url: '/a-propos', group: 'institutional', sortOrder: 1 },
  { label: 'Partenaires', url: '/a-propos', group: 'institutional', sortOrder: 2 },
  { label: 'Mentions légales', url: '/a-propos', group: 'institutional', sortOrder: 3 },
  { label: "Avis d'appel à projets", url: '/appels', group: 'resources', sortOrder: 1 },
  { label: 'Formulaires et guides', url: '/candidature', group: 'resources', sortOrder: 2 },
] as const;

const fallbackPrimaryNav = [
  { labelFr: 'Accueil', labelRn: 'Intango', url: '/', sortOrder: 1 },
  { labelFr: 'À propos', labelRn: 'Ibijanye', url: '/a-propos', sortOrder: 2 },
  { labelFr: 'Chaînes de valeur', labelRn: 'Imirongo y’agaciro', url: '/chaines-valeur', sortOrder: 3 },
  { labelFr: 'Appels', labelRn: 'Amasoko', url: '/appels', sortOrder: 4 },
  { labelFr: 'Ressources', labelRn: 'Inyandiko', url: '/ressources', sortOrder: 5 },
  { labelFr: 'Candidature', labelRn: 'Gusaba', url: '/candidature', sortOrder: 6 },
] as const;

const fallbackNewsNav = [
  { labelFr: 'Actualités', labelRn: 'Amakuru', url: '/actualites', sortOrder: 1 },
  { labelFr: 'Événements', labelRn: 'Ibikorwa', url: '/evenements', sortOrder: 2 },
  { labelFr: 'Communiqués', labelRn: 'Amatangazo', url: '/actualites?categorie=communiques', sortOrder: 3 },
  { labelFr: 'Annonces / résultats', labelRn: 'Ibisohoka', url: '/actualites?categorie=annonces-resultats', sortOrder: 4 },
] as const;

function normalizeNavItems<T extends NavigationLinkItem>(items: NavigationLinkItem[] | undefined, fallback: readonly T[]) {
  const source = (items || [])
    .filter((item) => item.isVisible !== false && item.url)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return source.length > 0 ? source : fallback;
}

function localizedLabel(item: NavigationLinkItem | { labelFr?: string; labelRn?: string }, language: SiteLanguage) {
  return language === 'rn' ? item.labelRn || item.labelFr || '' : item.labelFr || item.labelRn || '';
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language = cookieStore.get('subco-lang')?.value === 'rn' ? 'rn' : 'fr';
  const [cmsFooterLinks, siteNavigation] = await Promise.all([getFooterLinks(), getSiteNavigation()]);
  const footerLinks = cmsFooterLinks.length > 0 ? cmsFooterLinks : fallbackFooterLinks;
  const primaryNav = normalizeNavItems(siteNavigation?.primaryItems, fallbackPrimaryNav);
  const newsNav = normalizeNavItems(siteNavigation?.newsItems, fallbackNewsNav);
  const supportLabel = language === 'rn'
    ? siteNavigation?.supportLabelRn || 'Ubufasha / Twandikire'
    : siteNavigation?.supportLabelFr || 'Support / Contact';
  const supportUrl = siteNavigation?.supportUrl || '/candidature';
  const newsLabel = language === 'rn'
    ? siteNavigation?.newsLabelRn || 'Amakuru'
    : siteNavigation?.newsLabelFr || 'Actualités';
  const ctaLabel = language === 'rn'
    ? siteNavigation?.ctaLabelRn || 'Gusaba'
    : siteNavigation?.ctaLabelFr || 'Candidater';
  const ctaUrl = siteNavigation?.ctaUrl || '/candidature/deposer';
  const brandLabel = siteNavigation?.brandLabel || 'SUBCO PRETE';

  return (
    <html lang={language}>
      <body suppressHydrationWarning>
        <div className="site-topbar">
          <div className="container topbar-wrap">
            <span>Programme PRETE · Subventions de contrepartie</span>
            <div className="topbar-links">
              <Link href={supportUrl}>{supportLabel}</Link>
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
                <Link key={`${item.url}-${item.sortOrder || 0}`} href={item.url || '/'}>
                  {localizedLabel(item, language)}
                </Link>
              ))}
              <div className="nav-dropdown">
                <Link href={newsNav[0]?.url || '/actualites'} className="nav-dropdown-trigger">{newsLabel}</Link>
                <div className="nav-dropdown-menu">
                  {newsNav.map((item) => (
                    <Link key={`${item.url}-${item.sortOrder || 0}`} href={item.url || '/'}>
                      {localizedLabel(item, language)}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href={ctaUrl} className="btn primary nav-cta">{ctaLabel}</Link>
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
