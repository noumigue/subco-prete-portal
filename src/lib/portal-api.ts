import type {
  PortalAppel,
  PortalCandidature,
  PortalContenuAide,
  PortalFiliere,
  PortalNotification,
  PortalOrganisation,
  PortalProvince,
  PortalResourceDocument,
  PortalSession,
  PortalStatutJuridique,
  PortalTypeContrepartie,
  PortalTypePiece,
} from './portal-types';
import { getPortalJwt } from './portal-auth';
import { REFERENTIEL_TAGS } from './portal-revalidate';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

type StrapiCollection<T> = { data?: T[] };
type StrapiItem<T> = { data?: T };

async function portalFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const jwt = await getPortalJwt();
  if (!jwt) return null;

  const response = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<T>;
}

// Referentiel : ISR (300 s) + tag par collection pour l'invalidation a la demande via webhook.
async function publicFetch<T>(path: string, tags: string[] = []): Promise<T | null> {
  const response = await fetch(`${STRAPI_URL}${path}`, {
    next: { revalidate: 300, tags },
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<T>;
}

export async function getPortalOrganisation() {
  const response = await portalFetch<StrapiCollection<PortalOrganisation>>(
    '/api/organisations?populate[0]=province&populate[1]=commune&populate[2]=filierePrincipale&populate[3]=statutJuridique',
  );
  return response?.data?.[0] || null;
}

export async function getPortalCandidatures() {
  const response = await portalFetch<StrapiCollection<PortalCandidature>>(
    '/api/candidatures?populate[0]=appel&populate[1]=organisation&populate[2]=statut&populate[3]=pdfPermanent&populate[4]=notificationDecision&populate[5]=complements&populate[6]=notifications',
  );
  return response?.data || [];
}

export async function getPortalCandidature(documentId: string) {
  const response = await portalFetch<StrapiItem<PortalCandidature>>(
    `/api/candidatures/${documentId}?populate[0]=appel&populate[1]=organisation&populate[2]=statut&populate[3]=pdfPermanent&populate[4]=notificationDecision&populate[5]=complements.fichier&populate[6]=notifications`,
  );
  return response?.data || null;
}

export async function getPortalNotifications() {
  const response = await portalFetch<StrapiCollection<PortalNotification>>('/api/notifications?populate[0]=candidature');
  return response?.data || [];
}

// Predicat strict (remediation 1.2) : seuls les appels `ouvert` sont candidatables (CTA).
export async function getPortalOpenCalls() {
  const response = await publicFetch<StrapiCollection<PortalAppel>>(
    '/api/appels?filters[statut][$eq]=ouvert&sort[0]=ouvertLe:asc',
    [REFERENTIEL_TAGS.appel],
  );
  return response?.data || [];
}

// Appels `a_venir` : bandeau d'information « prochain appel a venir », jamais un CTA.
export async function getPortalUpcomingCalls() {
  const response = await publicFetch<StrapiCollection<PortalAppel>>(
    '/api/appels?filters[statut][$eq]=a_venir&sort[0]=ouvertLe:asc',
    [REFERENTIEL_TAGS.appel],
  );
  return response?.data || [];
}

export async function getPortalTypePieces() {
  const response = await publicFetch<StrapiCollection<PortalTypePiece>>(
    '/api/type-pieces?sort[0]=ordre:asc',
    [REFERENTIEL_TAGS.typePiece],
  );
  return response?.data || [];
}

// Provinces + communes + table de remap (`anciensNoms`) — sert le garde-fou remap cote portail.
export async function getPortalProvinces() {
  const response = await publicFetch<StrapiCollection<PortalProvince>>(
    '/api/provinces?populate[communes][sort][0]=nom:asc&sort[0]=nom:asc',
    [REFERENTIEL_TAGS.province, REFERENTIEL_TAGS.commune],
  );
  return response?.data || [];
}

export async function getPortalStatutJuridiques() {
  const response = await publicFetch<StrapiCollection<PortalStatutJuridique>>(
    '/api/statut-juridiques?sort[0]=ordre:asc',
    [REFERENTIEL_TAGS.statutJuridique],
  );
  return response?.data || [];
}

export async function getPortalFilieres() {
  const response = await publicFetch<StrapiCollection<PortalFiliere>>(
    '/api/filieres?sort[0]=nom:asc',
    [REFERENTIEL_TAGS.filiere],
  );
  return response?.data || [];
}

export async function getPortalTypeContreparties() {
  const response = await publicFetch<StrapiCollection<PortalTypeContrepartie>>(
    '/api/type-contreparties?sort[0]=ordre:asc',
    [REFERENTIEL_TAGS.typeContrepartie],
  );
  return response?.data || [];
}

// Contenu d'aide editorial (ex. exemples de types d'infrastructure — cle `exemples-infrastructure`).
export async function getPortalContenuAide(cle: string) {
  const response = await publicFetch<StrapiCollection<PortalContenuAide>>(
    `/api/contenus-aide?filters[cle][$eq]=${encodeURIComponent(cle)}`,
    [REFERENTIEL_TAGS.contenuAide],
  );
  return response?.data?.[0] || null;
}

export async function getPortalResourceDocuments() {
  const response = await publicFetch<StrapiCollection<PortalResourceDocument>>(
    '/api/resource-documents?populate=file&sort[0]=title:asc',
    [REFERENTIEL_TAGS.resourceDocument],
  );
  return response?.data || [];
}

export async function createPortalDraft(session: PortalSession) {
  return portalFetch<StrapiItem<PortalCandidature>>('/api/candidatures', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        titreProjet: `Nouvelle candidature - ${session.orgName}`,
      },
    }),
  });
}

export async function deletePortalDraft(documentId: string) {
  return portalFetch(`/api/candidatures/${documentId}`, {
    method: 'DELETE',
  });
}

export async function markNotificationRead(documentId: string) {
  return portalFetch(`/api/notifications/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { lu: true } }),
  });
}

// Sauvegarde d'une etape du brouillon (3.0) : seuls titreProjet et donneesProjet
// sont acceptes cote serveur (whitelist du controleur).
export async function updatePortalDraft(documentId: string, data: { titreProjet?: string; donneesProjet?: unknown }) {
  return portalFetch<StrapiItem<PortalCandidature>>(`/api/candidatures/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}

// Consolidation etape 1 (J1/J2) : identite & siege ecrivent le profil maitre `organisation`.
// Les relations sont passees par documentId (`set`).
export async function upsertPortalOrganisation(data: Record<string, unknown>) {
  return portalFetch<StrapiItem<PortalOrganisation>>('/api/organisations', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

// Soumission (3.0) : effets serveur atomiques (numeroDossier, dateDepot, PDF permanent, statut soumis, accuse).
export async function submitPortalCandidature(documentId: string): Promise<{ data?: PortalCandidature; error?: string }> {
  const jwt = await getPortalJwt();
  if (!jwt) return { error: 'Session expiree.' };

  const response = await fetch(`${STRAPI_URL}/api/candidatures/${documentId}/soumettre`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: PortalCandidature; error?: { message?: string } }
    | null;

  if (!response.ok) {
    return { error: payload?.error?.message || 'La soumission a echoue.' };
  }

  return { data: payload?.data };
}

// Telephone de notification (D1) : capte a la 1re candidature, remonte au compte.
export async function updatePortalPhone(phone: string) {
  return portalFetch<{ ok: boolean }>(`/api/portal-compte/telephone`, {
    method: 'PUT',
    body: JSON.stringify({ phone }),
  });
}

// Upload authentifie (multipart) vers Strapi. Retourne { id, name } du media cree, ou null.
export async function uploadPortalFile(file: File): Promise<{ id: number; name: string } | null> {
  const jwt = await getPortalJwt();
  if (!jwt || !file || file.size === 0) return null;

  const form = new FormData();
  form.append('files', file, file.name);

  // NB : pas de Content-Type manuel — laisser fetch poser le boundary multipart.
  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as Array<{ id: number; name?: string }>;
  if (!payload?.[0]?.id) return null;
  return { id: payload[0].id, name: payload[0].name || file.name };
}

// Depot d'un complement (remediation 1.7) : rattache le media au complement demande.
// Le controleur cote CMS passe le statut a `fourni`, emet la notification, et ne touche
// jamais au pdfPermanent (depot en ajout).
export async function depositComplement(documentId: string, fileId: number) {
  return portalFetch(`/api/complements/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { fichier: fileId } }),
  });
}
