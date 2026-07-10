'use client';

import { useEffect, useRef } from 'react';
import { logoutAction } from '@/app/(operator)/actions';

// Deconnexion : la modification du cookie doit passer par une Server Action
// (interdit pendant le rendu d'un Server Component en Next 16). On auto-soumet.
export function OperatorAutoLogout() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <main className="operator-auth-main">
      <section className="operator-auth-screen">
        <div className="operator-auth-card operator-auth-card-wall">
          <div className="operator-auth-badge">👋</div>
          <h1>Déconnexion…</h1>
          <form ref={formRef} action={logoutAction}>
            <button type="submit" className="operator-secondary-btn">Se déconnecter</button>
          </form>
        </div>
      </section>
    </main>
  );
}
