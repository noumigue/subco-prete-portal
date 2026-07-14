'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { definirMotDePasseAction } from '@/app/(gestion)/actions';

const MIN = 8;

export function DefinirMotDePasseForm({ token, email, nom }: { token: string; email: string; nom: string }) {
  const router = useRouter();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < MIN) { setError(`Le mot de passe doit comporter au moins ${MIN} caractères.`); return; }
    if (pwd !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    startTransition(async () => {
      const r = await definirMotDePasseAction(token, pwd);
      if (r.ok) {
        setDone(true);
        window.setTimeout(() => router.push('/gestion/connexion?active=1'), 1400);
      } else {
        setError(r.error || 'L’activation a échoué.');
      }
    });
  }

  if (done) {
    return (
      <>
        <p className="gx-flash">Compte activé. Redirection vers la connexion…</p>
        <p className="gx-login-note"><Link className="gx-back" href="/gestion/connexion">Aller à la connexion</Link></p>
      </>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="gx-login-note" style={{ marginTop: 0 }}>Bonjour <b>{nom}</b> — compte <b>{email}</b>.</p>
      {error && <p className="gx-flash err">{error}</p>}
      <label htmlFor="pwd">Nouveau mot de passe</label>
      <input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={MIN} required autoComplete="new-password" placeholder={`${MIN} caractères minimum`} />
      <label htmlFor="confirm">Confirmer le mot de passe</label>
      <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
      <button type="submit" className="gx-btn gx-btn-primary" style={{ width: '100%', marginTop: 14 }} disabled={pending}>{pending ? 'Activation…' : 'Activer mon compte'}</button>
      <p className="gx-login-note">En activant, vous définissez votre mot de passe — rien ne circule en clair.</p>
    </form>
  );
}
