import { getBrandAssets } from '@/lib/strapi-public';

export default async function OperatorAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrandAssets();
  const authLogo = brand.logoUrl || brand.logoIconUrl;
  return (
    <div className="operator-auth-shell">
      <header className="operator-auth-topbar">
        <div className="operator-auth-brand">
          {authLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="brand-logo" src={authLogo} alt={brand.label} />
          ) : (
            <>
              <span className="operator-auth-brand-mark">SP</span>
              <span>SUBCO-PRETE<small>Accès opérateur</small></span>
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
