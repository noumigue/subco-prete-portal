import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUBCO PRETE',
  description: 'Portail de subventions de contrepartie PRETE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <div className="site-topbar">
          <div className="container topbar-wrap">
            <span>Programme PRETE · Subventions de contrepartie</span>
            <span>contact: support@subco-prete.org</span>
          </div>
        </div>
        <header className="site-header">
          <div className="container nav-wrap">
            <Link href="/" className="brand">SUBCO PRETE</Link>
            <nav className="main-nav">
              <Link href="/chaines-valeur">Chaînes de valeur</Link>
              <Link href="/appels">Appels</Link>
              <Link href="/evenements">Événements</Link>
              <Link href="/actualites">Actualités</Link>
              <Link href="/candidature" className="btn primary nav-cta">Candidater</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container footer-wrap">
            <p>© {new Date().getFullYear()} SUBCO PRETE</p>
            <p>Plateforme d'information et de soumission</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
