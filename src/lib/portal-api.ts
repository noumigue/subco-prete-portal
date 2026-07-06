import type {
  PortalAppel,
  PortalCandidature,
  PortalNotification,
  PortalOrganisation,
  PortalResourceDocument,
  PortalSession,
  PortalTypePiece,
} from './portal-types';
import { getPortalJwt } from './portal-auth';

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

async function publicFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${STRAPI_URL}${path}`, {
    next: { revalidate: 300 },
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

export async function getPortalOpenCalls() {
  const response = await publicFetch<StrapiCollection<PortalAppel>>('/api/appels?filters[statut][$in][0]=ouvert&filters[statut][$in][1]=a_venir&sort[0]=ouvertLe:asc');
  return response?.data || [];
}

export async function getPortalTypePieces() {
  const response = await publicFetch<StrapiCollection<PortalTypePiece>>('/api/type-pieces?sort[0]=ordre:asc');
  return response?.data || [];
}

export async function getPortalResourceDocuments() {
  const response = await publicFetch<StrapiCollection<PortalResourceDocument>>('/api/resource-documents?populate=file&sort[0]=title:asc');
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
