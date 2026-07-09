import type { PortalProvince } from './portal-types';

// Garde-fou remap provinces (remediation 1.4).
// A TOUTE LECTURE d'une valeur stockee (profil, « Identique au siege », brouillon),
// une valeur de l'ancien decoupage est remappee vers l'une des 5 provinces actuelles.
// On ne reinjecte JAMAIS une valeur perimee a l'ecriture : le formulaire ecrit toujours
// le `nom` de la province actuelle retournee ici.
//
// La table de correspondance vit dans Strapi (`province.anciensNoms`), editable au CMS.

export function remapProvinceName(
  provinces: PortalProvince[],
  storedName?: string | null,
): { current: string | null; wasRemapped: boolean } {
  if (!storedName) return { current: null, wasRemapped: false };

  const normalized = storedName.trim().toLowerCase();

  // 1. Deja une province actuelle → inchangee.
  const direct = provinces.find((p) => (p.nom || '').trim().toLowerCase() === normalized);
  if (direct) return { current: direct.nom || null, wasRemapped: false };

  // 2. Ancien libelle → province actuelle qui l'absorbe.
  const remapped = provinces.find((p) =>
    (p.anciensNoms || []).some((old) => (old || '').trim().toLowerCase() === normalized),
  );
  if (remapped) return { current: remapped.nom || null, wasRemapped: true };

  // 3. Inconnue → non remappable (l'appelant affichera un etat « a confirmer »).
  return { current: null, wasRemapped: false };
}
