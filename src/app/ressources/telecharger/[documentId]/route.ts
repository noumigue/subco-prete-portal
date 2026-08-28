import type { NextRequest } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

// Force le téléchargement (Content-Disposition: attachment) via un proxy same-origin,
// pour contourner le fait que l'attribut `download` est ignoré en cross-origin (fichiers sur le CDN).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type StrapiFile = { url?: string; mime?: string; ext?: string };
type StrapiOne = { data?: { title?: string; file?: StrapiFile } };

function absoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${STRAPI_URL}${url}`;
}

// « Annexe 2 : Avis d'appel à projets » -> « Annexe-2-Avis-d-appel-a-projets »
function asciiSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'document';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  let one: StrapiOne | null = null;
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/resource-documents/${encodeURIComponent(documentId)}?populate=file`,
      { cache: 'no-store' },
    );
    if (res.ok) one = (await res.json()) as StrapiOne;
  } catch {
    one = null;
  }

  const file = one?.data?.file;
  if (!file?.url) {
    return new Response('Document introuvable.', { status: 404 });
  }

  const ext = file.ext || '.pdf';
  const filename = `${asciiSlug(one?.data?.title || 'document')}${ext}`;
  const utf8Name = encodeURIComponent(`${one?.data?.title || 'document'}${ext}`);

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(absoluteUrl(file.url), { cache: 'no-store' });
  } catch {
    return new Response('Fichier momentanément indisponible.', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response('Fichier momentanément indisponible.', { status: 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', file.mime || upstream.headers.get('content-type') || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${utf8Name}`);
  const length = upstream.headers.get('content-length');
  if (length) headers.set('Content-Length', length);
  // Surtout PAS de cache : cette route resout le fichier a chaque requete, mais le
  // portail est servi derriere un CDN qui, lui, memorisait la reponse une heure. Un
  // document remplace continuait donc d'etre servi dans son ancienne version — constate
  // deux fois, les 26 et 28/08/2026. Le cout est negligeable : quelques centaines de Ko
  // par telechargement, et les fichiers eux-memes restent caches sur leur propre CDN.
  headers.set('Cache-Control', 'no-store');

  return new Response(upstream.body, { status: 200, headers });
}
