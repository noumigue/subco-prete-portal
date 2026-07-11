export default function GestionAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="gx gx-auth-root">
      <header className="gx-auth-top">
        <div className="gx-brand">
          <span className="gx-mark">SP</span>
          <span>SUBCO-PRETE<small>Espace de gestion</small></span>
        </div>
      </header>
      {children}
    </div>
  );
}
