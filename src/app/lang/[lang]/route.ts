import { NextResponse } from 'next/server';

const SUPPORTED_LANGUAGES = new Set(['fr', 'rn']);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const safeLang = SUPPORTED_LANGUAGES.has(lang) ? lang : 'fr';
  const referer = request.headers.get('referer');
  const fallbackUrl = new URL('/', request.url);
  const redirectUrl = referer ? new URL(referer) : fallbackUrl;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('subco-lang', safeLang, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
