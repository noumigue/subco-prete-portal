'use client';

import { useCallback, useEffect, useState } from 'react';

// Vignette d'accueil (overlay) : informe que les candidatures ne sont pas encore ouvertes,
// affiche le compte à rebours J-XX jusqu'à l'OUVERTURE, et renvoie vers la bande d'inscription.
// Additive : ne modifie pas les sections existantes de la home. Ré-affichée à CHAQUE chargement
// (pas de mémorisation) : la fermeture ne masque que la vue courante.

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - startToday.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HomeOpeningModal({ openingDate }: { openingDate: string }) {
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => setOpen(false), []);

  const goNotify = useCallback(() => {
    // Défiler vers la bande d'inscription AVANT de fermer (l'overlay est en position:fixed,
    // sa fermeture n'affecte pas le scroll). Plus fiable qu'un scroll différé après démontage.
    document.getElementById('home-notification-band')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    // Affichée à chaque montage (donc à chaque chargement de la home). On part de `false` au
    // rendu serveur (le compte à rebours dépend de la date locale) puis on affiche côté client,
    // ce qui évite tout écart d'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open) return null;

  const d = daysUntil(openingDate);

  return (
    <div className="home-openmodal-overlay" role="dialog" aria-modal="true" aria-labelledby="home-openmodal-title">
      <div className="home-openmodal">
        <button type="button" className="home-openmodal-close" aria-label="Fermer" onClick={dismiss}>×</button>
        {d != null && d > 0 ? (
          <span className="home-openmodal-badge" aria-label={`Ouverture dans ${d} jours`}>J-{d}</span>
        ) : null}
        <p className="home-openmodal-eyebrow">Candidatures</p>
        <h2 id="home-openmodal-title" className="home-openmodal-title">Le dépôt en ligne n’est pas encore ouvert</h2>
        <p className="home-openmodal-text">
          Vous ne pouvez pas encore candidater. Le dépôt ouvrira le{' '}
          <strong>{formatDate(openingDate)}</strong>. Laissez votre e-mail : nous vous préviendrons dès l’ouverture de l’appel.
        </p>
        <div className="home-openmodal-actions">
          <button type="button" className="btn primary" onClick={goNotify}>M’alerter à l’ouverture →</button>
          <button type="button" className="btn ghost" onClick={dismiss}>Plus tard</button>
        </div>
      </div>
    </div>
  );
}
