// Configuration de surface du site public (section 17 de la fiche de contrats).

// Bascule linguistique FR/Kirundi. Le Kirundi n'etant pas encore operationnel, le
// selecteur FR|KI est MASQUE du header et du footer publics (le code du toggle reste
// en place). L'interface reste en francais (`<html lang="fr">`). Reactivable en une
// seule ligne des que les traductions existeront — engagement d'accessibilite du projet.
export const LANG_TOGGLE_ENABLED = false;
