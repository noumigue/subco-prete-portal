import { getBrandAssets } from '@/lib/strapi-public';

export default async function GestionAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrandAssets();
  const authLogo = brand.logoUrl || brand.logoIconUrl;
  return (
    <div className="gx gx-auth-root">
      <header className="gx-auth-top">
        <div className="gx-brand">
          {authLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="brand-logo" src={authLogo} alt={brand.label} />
          ) : (
            <>
              <span className="gx-mark">SP</span>
              <span>SUBCO-PRETE<small>Espace de gestion</small></span>
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
