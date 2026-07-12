import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionPendingCount } from '@/lib/gestion-api';
import { GestionShell } from '@/components/gestion-shell';

// Garde d'acces (gestion)/(app) : session valide ET role interne {instructeur, ugp, comite}.
// Un operateur (candidat/beneficiaire) est refuse (symetrique de la garde (operator)/(app)).
// `comite` (temps 2) : porte acceptee, acces reduit au dossier de seance (F2).
const INTERNAL_ROLES = new Set(['instructeur', 'ugp', 'comite']);

export default async function GestionAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getPortalSession();
  if (!session) {
    redirect('/gestion/connexion');
  }
  if (!INTERNAL_ROLES.has(session.role)) {
    redirect('/gestion/connexion?error=acces-gestion');
  }

  // Badge « à valider » (ugp) : nb de propositions en attente. Nul cote instructeur.
  const pendingCount = session.role === 'ugp' ? await getGestionPendingCount() : 0;

  return (
    <GestionShell session={session} pendingCount={pendingCount}>
      {children}
    </GestionShell>
  );
}
