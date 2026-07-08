import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PortalOrganisation, PortalRole, PortalSession } from './portal-types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';
const COOKIE_NAME = 'subco_portal_jwt';

type StrapiAuthResponse = {
  jwt?: string;
  user?: {
    id: number;
    email: string;
    username?: string;
    confirmed?: boolean;
    role?: {
      type?: string;
      name?: string;
    };
  };
  error?: {
    message?: string;
    details?: Record<string, unknown>;
  };
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function strapiFetch(path: string, init?: RequestInit) {
  return fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

export async function setPortalJwt(jwt: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  });
}

export async function clearPortalJwt() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getPortalJwt() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value || null;
}

export async function registerCandidate(email: string, password: string) {
  const response = await strapiFetch('/api/auth/local/register', {
    method: 'POST',
    body: JSON.stringify({
      username: email,
      email,
      password,
    }),
  });

  if (!response.ok) {
    const payload = await parseJson<StrapiAuthResponse>(response);
    throw new Error(payload?.error?.message || "L'inscription a echoue.");
  }
}

export async function loginCandidate(email: string, password: string) {
  const response = await strapiFetch('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({
      identifier: email,
      password,
    }),
  });

  const payload = await parseJson<StrapiAuthResponse>(response);

  if (!response.ok || !payload?.jwt) {
    const errorMessage = payload?.error?.message || 'Connexion impossible.';
    throw new Error(errorMessage);
  }

  await setPortalJwt(payload.jwt);
  return payload;
}

export async function resendConfirmation(email: string) {
  const response = await strapiFetch('/api/auth/send-email-confirmation', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = await parseJson<StrapiAuthResponse>(response);
    throw new Error(payload?.error?.message || "Le lien n'a pas pu etre renvoye.");
  }
}

export async function requestPasswordReset(email: string) {
  await strapiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(code: string, password: string) {
  const response = await strapiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      code,
      password,
      passwordConfirmation: password,
    }),
  });

  if (!response.ok) {
    const payload = await parseJson<StrapiAuthResponse>(response);
    throw new Error(payload?.error?.message || 'Impossible de reinitialiser le mot de passe.');
  }
}

async function fetchCurrentUser(jwt: string) {
  const response = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<{
    id: number;
    email: string;
    username?: string;
    confirmed?: boolean;
    role?: {
      type?: string;
      name?: string;
    };
  }>;
}

async function fetchOrganisation(jwt: string) {
  const response = await fetch(
    `${STRAPI_URL}/api/organisations?populate[0]=province&populate[1]=commune&populate[2]=filierePrincipale&populate[3]=statutJuridique`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: PortalOrganisation[] };
  return payload.data?.[0] || null;
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const jwt = await getPortalJwt();
  if (!jwt) return null;

  const [user, organisation] = await Promise.all([fetchCurrentUser(jwt), fetchOrganisation(jwt)]);
  if (!user?.id) return null;

  const rawRole = user.role?.type || 'authenticated';
  const role = (rawRole === 'beneficiaire'
    ? 'beneficiaire'
    : rawRole === 'instructeur' || rawRole === 'ugp' || rawRole === 'comite' || rawRole === 'banque'
      ? (rawRole as PortalRole)
      : 'candidat');
  return {
    userId: user.id,
    orgName: organisation?.nom || user.username || user.email,
    email: user.email,
    emailVerified: Boolean(user.confirmed),
    phone: organisation?.telephone || null,
    role,
  };
}

export async function requirePortalSession() {
  const session = await getPortalSession();
  if (!session) {
    const path = (await headers()).get('x-pathname') || '';
    const next = path.startsWith('/') && !path.startsWith('//') ? `?next=${encodeURIComponent(path)}` : '';
    redirect(`/connexion${next}`);
  }

  return session;
}
