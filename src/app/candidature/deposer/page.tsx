import { redirect } from 'next/navigation';

// L'ancien formulaire de candidature anonyme (dépôt sans compte) a été supprimé :
// le dépôt se fait désormais après création de compte, via l'espace opérateur.
// Cette URL est conservée en filet de sécurité (liens externes / favoris) et
// renvoie vers le nouveau parcours authentifié ; l'espace opérateur redirige
// lui-même un visiteur non connecté vers /connexion?next=/candidatures/nouvelle.
export default function DeposerCandidatureRedirect() {
  redirect('/candidatures/nouvelle');
}
