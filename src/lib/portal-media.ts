// Resolution d'URL de media Strapi (utilisable cote serveur ET client — aucune dependance next/headers).
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

export function portalMediaUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith('/') ? `${STRAPI_URL}${url}` : url;
}
