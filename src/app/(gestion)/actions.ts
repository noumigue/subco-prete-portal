'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clearPortalJwt, getPortalSession, loginCandidate, requestPasswordReset } from '@/lib/portal-auth';
import { uploadPortalFile } from '@/lib/portal-api';
import {
  cloreAppel,
  ouvrirAppel,
  priseEnCharge,
  proposerCompletude,
  proposerEligibilite,
  reassigner,
  renvoyerCompletude,
  renvoyerEligibilite,
  validerCompletude,
  validerEligibilite,
} from '@/lib/gestion-api';

const INTERNAL_ROLES = new Set(['instructeur', 'ugp']);

function readString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

// Porte interne : primitive de login commune (/api/auth/local), puis controle du role.
// Un compte operateur qui tenterait cette porte est refuse (cookie efface + message).
export async function loginGestionAction(formData: FormData) {
  const email = readString(formData, 'email');
  const password = readString(formData, 'password');

  try {
    await loginCandidate(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'connexion';
    redirect(`/gestion/connexion?error=${encodeURIComponent(message)}`);
  }

  const session = await getPortalSession();
  if (!session || !INTERNAL_ROLES.has(session.role)) {
    await clearPortalJwt();
    redirect('/gestion/connexion?error=acces-gestion');
  }
  redirect('/gestion/dossiers');
}

export async function logoutGestionAction() {
  await clearPortalJwt();
  redirect('/gestion/connexion');
}

// Mot de passe oublie : reutilise la mecanique existante, message neutre (anti-enumeration D4).
export async function requestResetGestionAction(formData: FormData) {
  const email = readString(formData, 'email');
  await requestPasswordReset(email);
  redirect('/gestion/mot-de-passe-oublie?sent=1');
}

// ——— C1 : prise en charge / reassignation ———
export async function priseEnChargeAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  const result = await priseEnCharge(documentId);
  revalidatePath('/gestion/dossiers');
  redirect(result.ok ? '/gestion/dossiers?pris=1' : `/gestion/dossiers?error=${encodeURIComponent(result.error || 'prise')}`);
}

export async function reassignerAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  await reassigner(documentId);
  revalidatePath('/gestion/dossiers');
  redirect('/gestion/dossiers?reassigne=1');
}

// ——— C2/C3 : completude ———
export type ProposerCompletudeInput = {
  documentId: string;
  verdictsPieces: Record<string, { etat: string; note?: string }>;
  verdictGlobal: 'complet' | 'complements' | 'rejet';
  complementsProposes?: { pieces: string[]; echeance?: string; message?: string };
  motifRejet?: string;
};

export async function proposerCompletudeAction(input: ProposerCompletudeInput): Promise<{ ok: boolean; error?: string }> {
  const result = await proposerCompletude(input.documentId, {
    verdictsPieces: input.verdictsPieces,
    verdictGlobal: input.verdictGlobal,
    complementsProposes: input.complementsProposes,
    motifRejet: input.motifRejet,
  });
  revalidatePath('/gestion/dossiers');
  return result;
}

export async function validerCompletudeAction(input: { documentId: string; notificationDecisionFileId?: number }): Promise<{ ok: boolean; error?: string }> {
  const result = await validerCompletude(input.documentId, input.notificationDecisionFileId);
  revalidatePath('/gestion/dossiers');
  return result;
}

export async function renvoyerCompletudeAction(input: { documentId: string; commentaire: string }): Promise<{ ok: boolean; error?: string }> {
  const result = await renvoyerCompletude(input.documentId, input.commentaire);
  revalidatePath('/gestion/dossiers');
  return result;
}

// ——— C4 : eligibilite ———
export type ProposerEligibiliteInput = {
  documentId: string;
  verdictsCriteres: Record<string, { etat: string; justification?: string }>;
  verdictGlobal: 'eligible' | 'rejet';
  motifRejet?: string;
};

export async function proposerEligibiliteAction(input: ProposerEligibiliteInput): Promise<{ ok: boolean; error?: string }> {
  const result = await proposerEligibilite(input.documentId, {
    verdictsCriteres: input.verdictsCriteres,
    verdictGlobal: input.verdictGlobal,
    motifRejet: input.motifRejet,
  });
  revalidatePath('/gestion/dossiers');
  return result;
}

export async function validerEligibiliteAction(input: { documentId: string; notificationDecisionFileId?: number }): Promise<{ ok: boolean; error?: string }> {
  const result = await validerEligibilite(input.documentId, input.notificationDecisionFileId);
  revalidatePath('/gestion/dossiers');
  return result;
}

export async function renvoyerEligibiliteAction(input: { documentId: string; commentaire: string }): Promise<{ ok: boolean; error?: string }> {
  const result = await renvoyerEligibilite(input.documentId, input.commentaire);
  revalidatePath('/gestion/dossiers');
  return result;
}

// Upload de la notification de decision signee (rejet) — retourne l'id du media.
export async function uploadNotificationSigneeAction(formData: FormData): Promise<{ id: number; name: string } | null> {
  const file = formData.get('fichier');
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadPortalFile(file);
}

// ——— Appels ———
export async function ouvrirAppelAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  await ouvrirAppel(documentId);
  revalidatePath('/gestion/appels');
  redirect('/gestion/appels?ouvert=1');
}

export async function cloreAppelAction(formData: FormData) {
  const documentId = readString(formData, 'documentId');
  await cloreAppel(documentId);
  revalidatePath('/gestion/appels');
  redirect('/gestion/appels?clos=1');
}
