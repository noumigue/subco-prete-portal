import type { Metadata } from 'next';
import Link from 'next/link';
import { getFooterLinks } from '@/lib/strapi-public';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUBCO PRETE',
  description: 'Portail de subventions de contrepartie PRETE',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cmsFooterLinks = await getFooterLinks();
  const footerLinks = cmsFooterLinks.length > 0 ? cmsFooterLinks : fallbackFooterLinks;

  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <div className="site-topbar">
          <div className="container topbar-wrap">
            <span>Programme PRETE · Subventions de contrepartie</span>
            <div className="topbar-links">
              <Link href="/candidature">Support / Contact</Link>
              <span className="language-switch" aria-label="Choix de langue">
                <a hrefLang="fr" aria-current="true">FR</a>
                <span aria-hidden="true">|</span>
                <a hrefLang="rn">KI</a>
              </span>
            </div>
          </div>
        </div>
        <header className="site-header">
          <div className="container nav-wrap">
            <Link href="/" className="brand">SUBCO PRETE</Link>
            <nav className="main-nav">
              <Link href="/">Accueil</Link>
              <Link href="/a-propos">À propos</Link>
              <Link href="/chaines-valeur">Chaînes de valeur</Link>
              <Link href="/appels">Appels</Link>
              <Link href="/ressources">Ressources</Link>
              <Link href="/candidature">Candidature</Link>
              <div className="nav-dropdown">
                <Link href="/actualites" className="nav-dropdown-trigger">Actualités</Link>
                <div className="nav-dropdown-menu">
                  <Link href="/actualites">Actualités</Link>
                  <Link href="/evenements">Événements</Link>
                  <Link href="/actualites?categorie=communiques">Communiqués</Link>
                  <Link href="/actualites?categorie=annonces-resultats">Annonces / résultats</Link>
                </div>
              </div>
              <Link href="/candidature/deposer" className="btn primary nav-cta">Candidater</Link>
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
