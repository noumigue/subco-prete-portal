// Icônes de la sidebar de gestion — même type que l'espace opérateur (SVG à trait,
// Lucide/Feather, viewBox 24, sans fill/stroke inline : le style vient du CSS `.gx-ic svg`).
export function GestionNavIcon({ name }: { name?: string }) {
  switch (name) {
    case 'dossiers':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'evaluations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
      );
    case 'appels':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 11 18-5v12L3 14z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case 'rapport':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
          <line x1="3" y1="20" x2="21" y2="20" />
        </svg>
      );
    case 'decisions':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );
    case 'publication':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4z" />
        </svg>
      );
    case 'subventions':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11" />
        </svg>
      );
    case 'assistance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
          <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
          <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
        </svg>
      );
    case 'seance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="3" y1="22" x2="21" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <path d="M12 2 20 7H4z" />
        </svg>
      );
    case 'account':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
