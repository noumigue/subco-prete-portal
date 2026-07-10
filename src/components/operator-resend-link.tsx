'use client';

import { useEffect, useState } from 'react';
import { resendConfirmationAction } from '@/app/(operator)/actions';

// Renvoi du lien de confirmation avec compte a rebours anti-spam (remediation 2.1).
// Apres un envoi (redirection ?resent=1), le bouton est desactive pendant `cooldown` secondes.
export function OperatorResendLink({ email, justResent }: { email: string; justResent: boolean }) {
  const cooldown = 60;
  const [remaining, setRemaining] = useState(justResent ? cooldown : 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const disabled = remaining > 0;

  return (
    <form action={resendConfirmationAction}>
      <input type="hidden" name="email" value={email} />
      <button type="submit" className="operator-secondary-btn" disabled={disabled}>
        {disabled ? `Renvoyer le lien (${remaining}s)` : 'Renvoyer le lien'}
      </button>
    </form>
  );
}
