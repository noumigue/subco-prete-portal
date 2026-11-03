import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';
import { getGestionAssistance, getGestionMaturationCompte, getGestionPendingCount } from '@/lib/gestion-api';
import { getBrandAssets } from '@/lib/strapi-public';
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
  // Badge Assistance (phase 4) : nb de demandes non resolues — ugp ET instructeur (H2).
  const assistCount = session.role === 'comite'
    ? 0
    : await (async () => {
        // Compteurs serveur : inutile de charger les demandes pour afficher un badge.
        const { meta, rows } = await getGestionAssistance(1);
        if (meta) return meta.parStatut.ouverte + meta.parStatut.en_cours;
        return rows.filter((d) => d.statut !== 'resolue').length;
      })();
  // Badge « Mises a jour » : nb de demandes servies par l'operateur et attendant l'examen
  // de l'equipe. Sans lui, une reponse deposee n'etait visible qu'en ouvrant l'ecran —
  // et l'etat correspondant disparaissait du panneau de filtres des qu'il etait vide.
  const majCount = session.role === 'comite' ? 0 : await getGestionMaturationCompte();
  const brand = await getBrandAssets();

  return (
    <GestionShell session={session} pendingCount={pendingCount} assistCount={assistCount} majCount={majCount} brand={brand}>
      {children}
    </GestionShell>
  );
}
