export default function OperatorAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="operator-auth-shell">
      <header className="operator-auth-topbar">
        <div className="operator-auth-brand">
          <span className="operator-auth-brand-mark">SP</span>
          <span>SUBCO PRETE<small>Acces operateur</small></span>
        </div>
      </header>
      {children}
    </div>
  );
}
