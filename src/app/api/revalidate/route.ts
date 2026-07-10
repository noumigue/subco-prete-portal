import { revalidateTag } from 'next/cache';
import { resolveRevalidateTag } from '@/lib/portal-revalidate';

// Webhook de revalidation a la demande (remediation 1.3).
// Securise par secret. Invalide le tag correspondant au content-type notifie par Strapi.
// Next 16 : signature a deux arguments `revalidateTag(tag, 'max')` (stale-while-revalidate) — la
// forme mono-argument est depreciee. Cf. node_modules/next/dist/docs/.../revalidateTag.md.

type StrapiWebhookBody = {
  model?: string;
  event?: string;
};

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Le content-type peut arriver soit dans le body du webhook Strapi (`model`),
  // soit en query `?tag=` (declenchement manuel / debug).
  let model = url.searchParams.get('tag');
  if (!model) {
    const body = (await req.json().catch(() => null)) as StrapiWebhookBody | null;
    model = body?.model || null;
  }

  const tag = resolveRevalidateTag(model);
  if (!tag) {
    return Response.json({ revalidated: false, reason: 'unknown-model', model });
  }

  revalidateTag(tag, 'max');
  return Response.json({ revalidated: true, tag });
}
