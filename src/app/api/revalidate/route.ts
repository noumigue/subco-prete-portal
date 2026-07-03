import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  revalidateTag('infra', 'max');
  return Response.json({ revalidated: true, now: Date.now() });
}
