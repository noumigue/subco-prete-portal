export function InfraIcon({ name }: { name?: string }) {
  switch (name) {
    case 'production':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V10l5 3V8l5 3V6l4 2v13" />
          <path d="M8 21v-4" />
          <path d="M12 21v-3" />
          <path d="M16 21v-5" />
        </svg>
      );
    case 'stockage':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10 12 4l9 6" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-5h6v5" />
          <path d="M8 12h.01" />
          <path d="M16 12h.01" />
        </svg>
      );
    case 'logistique':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h11v8H3z" />
          <path d="M14 10h3l3 3v2h-6" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'qualite':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'numerique':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 18h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 8.5 4.5 4.5 0 0 0 7 18Z" />
          <path d="M12 11v6" />
          <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
        </svg>
      );
    case 'formation':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 8 9-4 9 4-9 4-9-4Z" />
          <path d="M7 10v4c0 1.8 2.2 3 5 3s5-1.2 5-3v-4" />
          <path d="M21 9v6" />
        </svg>
      );
    case 'immateriel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="7" height="5" rx="1" />
          <rect x="14" y="5" width="7" height="5" rx="1" />
          <rect x="8.5" y="14" width="7" height="5" rx="1" />
          <path d="M6.5 10v2h9v2" />
          <path d="M17.5 10v2h-9" />
        </svg>
      );
    case 'autres':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}
