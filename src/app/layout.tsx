import type { Metadata } from 'next';
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
