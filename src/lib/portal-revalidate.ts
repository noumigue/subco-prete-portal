// Carte centrale content-type Strapi -> tag de cache Next (remediation 1.3).
// Un tag par collection referentielle. Le webhook /api/revalidate invalide le bon tag
// selon le content-type notifie par Strapi (payload `model` = singularName).
// La couche data (portal-api) attache ces memes tags a chaque fetch referentiel.

export const REFERENTIEL_TAGS = {
  appel: 'appel',
  filiere: 'filiere',
  province: 'province',
  commune: 'commune',
  statutJuridique: 'statut-juridique',
  typeContrepartie: 'type-contrepartie',
  typePiece: 'type-piece',
  statutCandidature: 'statut-candidature',
  contenuAide: 'contenu-aide',
  resourceDocument: 'resource-document',
  faqEntree: 'faq-entree',
  faqItem: 'faq-item',
  documentTelechargeable: 'document-telechargeable',
  // Referentiels « Ma subvention » (Lot 2).
  modaliteDecaissement: 'modalite-decaissement',
  typeRapport: 'type-rapport',
  etapeContractuelle: 'etape-contractuelle',
  statutDemande: 'statut-demande',
} as const;

const KNOWN_TAGS = new Set<string>(Object.values(REFERENTIEL_TAGS));

/**
 * Resout le tag a invalider depuis le nom de content-type notifie par Strapi.
 * Strapi envoie `model` = singularName (ex. « filiere », « statut-juridique »),
 * qui coincide avec nos tags. Retourne null si le modele n'est pas referentiel.
 */
export function resolveRevalidateTag(model?: string | null): string | null {
  if (!model) return null;
  return KNOWN_TAGS.has(model) ? model : null;
}
