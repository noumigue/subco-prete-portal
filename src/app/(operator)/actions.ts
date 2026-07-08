'use server';

import { redirect } from 'next/navigation';
import { clearPortalJwt, loginCandidate, registerCandidate, requestPasswordReset, resendConfirmation, resetPassword } from '@/lib/portal-auth';
import { createPortalDraft, deletePortalDraft, markNotificationRead } from '@/lib/portal-api';
import { requirePortalSession } from '@/lib/portal-auth';

function readString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

export async function registerCandidateAction(formData: FormData) {
  const organizationName = readString(formData, 'organizationName');
  const email = readString(formData, 'email');
  const password = readString(formData, 'password');

  if (!organizationName || !email || !password) {
    redirect('/inscription?error=champs');
  }

  let target = `/verifier-email?email=${encodeURIComponent(email)}&org=${encodeURIComponent(organizationName)}`;

  try {
    await registerCandidate(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'inscription';
    target = `/inscription?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function loginCandidateAction(formData: FormData) {
  const email = readString(formData, 'email');
  const password = readString(formData, 'password');
  const next = readString(formData, 'next');
  // Anti open-redirect : uniquement des chemins internes (/…, pas //…).
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '';

  let target = safeNext || '/tableau-de-bord';

  try {
    await loginCandidate(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'connexion';
    target = /confirm/i.test(message)
      ? `/verifier-email?email=${encodeURIComponent(email)}&error=non-confirme`
      : `/connexion?error=${encodeURIComponent(message)}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ''}`;
  }

  redirect(target);
}

export async function resendConfirmationAction(formData: FormData) {
  const email = readString(formData, 'email');

  let target = `/verifier-email?email=${encodeURIComponent(email)}&resent=1`;

  try {
    await resendConfirmation(email);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'renvoi';
    target = `/verifier-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function requestResetAction(formData: FormData) {
  const email = readString(formData, 'email');
  await requestPasswordReset(email);
  redirect('/mot-de-passe-oublie?sent=1');
}

export async function resetPasswordAction(formData: FormData) {
  const code = readString(formData, 'code');
  const password = readString(formData, 'password');
  const confirm = readString(formData, 'passwordConfirmation');

  if (!code || !password || password !== confirm) {
    redirect('/reinitialiser?error=validation');
  }

  let target = '/connexion?reset=1';

  try {
    await resetPassword(code, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'reset';
    target = `/reinitialiser?code=${encodeURIComponent(code)}&error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function logoutAction() {
  await clearPortalJwt();
  redirect('/connexion');
}

export async function createDraftAction() {
  const session = await requirePortalSession();
  const draft = await createPortalDraft(session);
  const documentId = draft?.data?.documentId;

  if (!documentId) {
    redirect('/candidatures/nouvelle?error=creation');
  }

  redirect(`/candidatures/${documentId}/formulaire`);
}

export async function deleteDraftAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  if (documentId) {
    await deletePortalDraft(documentId);
  }
  redirect('/mes-candidatures?deleted=1');
}

export async function markNotificationReadAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  if (documentId) {
    await markNotificationRead(documentId);
  }
  redirect('/notifications');
}
