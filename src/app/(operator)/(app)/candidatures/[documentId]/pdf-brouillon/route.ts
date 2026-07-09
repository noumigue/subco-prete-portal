import { getPortalJwt } from '@/lib/portal-auth';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

// Proxy authentifie du PDF brouillon (3.0) : la route CMS exige le JWT (owner-scoped),
// qu'un simple lien HTML ne peut pas porter — on relaie donc cote serveur.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const jwt = await getPortalJwt();
  if (!jwt) {
    return new Response('Non autorise', { status: 401 });
  }

  const response = await fetch(`${STRAPI_URL}/api/candidatures/${documentId}/pdf-brouillon`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return new Response('PDF brouillon indisponible.', { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="brouillon-candidature.pdf"',
    },
  });
}
