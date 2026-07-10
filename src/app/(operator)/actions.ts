'use server';

import { redirect } from 'next/navigation';
import { clearPortalJwt, loginCandidate, registerCandidate, requestPasswordReset, resendConfirmation, resetPassword } from '@/lib/portal-auth';
import {
  changePortalPassword,
  createPortalDraft,
  deletePortalDraft,
  depositComplement,
  markAllNotificationsRead,
  markNotificationRead,
  requestPortalEmailChange,
  submitPortalCandidature,
  updatePortalDraft,
  updatePortalPhone,
  uploadPortalFile,
  upsertPortalOrganisation,
} from '@/lib/portal-api';
import { portalMediaUrl } from '@/lib/portal-media';
import { requirePortalSession } from '@/lib/portal-auth';
import type { PortalDonneesProjet } from '@/lib/portal-types';

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
    await registerCandidate(email, password, organizationName);
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
  const filter = readString(formData, 'filter');
  if (documentId) {
    await markNotificationRead(documentId);
  }
  redirect(filter === 'unread' ? '/notifications?filtre=non-lues' : '/notifications');
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsRead();
  redirect('/notifications');
}

// ——— Lot 1 : Mon organisation (profil maitre J2) ———

export type SaveOrganisationInput = {
  nom: string;
  contact?: string;
  adresse?: string;
  statutJuridiqueId?: string | null;
  filierePrincipaleId?: string | null;
  provinceId?: string | null;
  communeId?: string | null;
};

export async function saveOrganisationAction(input: SaveOrganisationInput): Promise<{ ok: boolean; error?: string }> {
  await requirePortalSession();
  if (!input.nom?.trim()) {
    return { ok: false, error: "Le nom de l'organisation est requis." };
  }
  try {
    const result = await upsertPortalOrganisation({
      nom: input.nom.trim(),
      contact: input.contact?.trim() || '',
      adresse: input.adresse?.trim() || '',
      ...(input.statutJuridiqueId ? { statutJuridique: { set: [input.statutJuridiqueId] } } : {}),
      ...(input.filierePrincipaleId ? { filierePrincipale: { set: [input.filierePrincipaleId] } } : {}),
      ...(input.provinceId ? { province: { set: [input.provinceId] } } : {}),
      ...(input.communeId ? { commune: { set: [input.communeId] } } : {}),
    });
    if (!result?.data) return { ok: false, error: "L'enregistrement a echoue." };
    return { ok: true };
  } catch {
    return { ok: false, error: "L'enregistrement a echoue." };
  }
}

// ——— Lot 1 : Mon compte ———

export async function changeEmailAction(formData: FormData) {
  await requirePortalSession();
  const email = readString(formData, 'email').toLowerCase();
  const result = await requestPortalEmailChange(email);
  redirect(result.ok ? '/mon-compte?email=envoye' : `/mon-compte?error=${encodeURIComponent(result.error || 'email')}`);
}

export async function changePasswordAction(formData: FormData) {
  await requirePortalSession();
  const current = readString(formData, 'currentPassword');
  const next = readString(formData, 'password');
  const confirm = readString(formData, 'passwordConfirmation');
  if (!current || !next || next.length < 8 || next !== confirm) {
    redirect('/mon-compte?error=mot-de-passe');
  }
  const result = await changePortalPassword(current, next, confirm);
  redirect(result.ok ? '/mon-compte?password=modifie' : `/mon-compte?error=${encodeURIComponent(result.error || 'mot-de-passe')}`);
}

export async function updatePhoneAction(formData: FormData) {
  await requirePortalSession();
  const phone = readString(formData, 'phone');
  if (phone) {
    await updatePortalPhone(phone);
  }
  redirect('/mon-compte?phone=enregistre');
}

// ——— Module 3 : persistance serveur du parcours (remediation 3.0) ———

export type SaveStepInput = {
  documentId: string;
  titreProjet?: string;
  donneesProjet: PortalDonneesProjet;
  // Consolidation etape 1 (J1/J2) : identite & siege ecrivent le profil maitre.
  organisation?: {
    nom?: string;
    contact?: string;
    telephone?: string;
    statutJuridiqueId?: string | null;
    provinceId?: string | null;
    communeId?: string | null;
    filierePrincipaleId?: string | null;
  };
  // Telephone de notification (D1) : 1re saisie remontee au compte.
  phone?: string;
};

function setRelation(documentId?: string | null) {
  return documentId ? { set: [documentId] } : undefined;
}

export async function saveCandidatureStepAction(input: SaveStepInput): Promise<{ ok: boolean; error?: string }> {
  await requirePortalSession();

  try {
    if (input.organisation) {
      const org = input.organisation;
      await upsertPortalOrganisation({
        ...(org.nom ? { nom: org.nom } : {}),
        ...(org.contact !== undefined ? { contact: org.contact } : {}),
        ...(org.telephone ? { telephone: org.telephone } : {}),
        ...(setRelation(org.statutJuridiqueId) ? { statutJuridique: setRelation(org.statutJuridiqueId) } : {}),
        ...(setRelation(org.provinceId) ? { province: setRelation(org.provinceId) } : {}),
        ...(setRelation(org.communeId) ? { commune: setRelation(org.communeId) } : {}),
        ...(setRelation(org.filierePrincipaleId) ? { filierePrincipale: setRelation(org.filierePrincipaleId) } : {}),
      });
    }

    if (input.phone) {
      await updatePortalPhone(input.phone);
    }

    const result = await updatePortalDraft(input.documentId, {
      ...(input.titreProjet ? { titreProjet: input.titreProjet } : {}),
      donneesProjet: input.donneesProjet,
    });

    if (!result?.data) {
      return { ok: false, error: "L'enregistrement du brouillon a echoue." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "L'enregistrement du brouillon a echoue." };
  }
}

export async function uploadPieceAction(formData: FormData): Promise<{ id: number; name: string } | null> {
  await requirePortalSession();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadPortalFile(file);
}

export type SubmitResult = {
  ok: boolean;
  error?: string;
  numeroDossier?: string;
  dateDepot?: string;
  pdfUrl?: string | null;
};

export async function submitCandidatureAction(documentId: string): Promise<SubmitResult> {
  await requirePortalSession();
  const result = await submitPortalCandidature(documentId);

  if (!result.data) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    numeroDossier: result.data.numeroDossier || undefined,
    dateDepot: result.data.dateDepot || undefined,
    pdfUrl: portalMediaUrl(result.data.pdfPermanent?.url),
  };
}

// Depot reel d'un complement demande (remediation 1.7) : upload authentifie du fichier
// puis rattachement au complement. Le CMS passe le statut a `fourni`, emet la notification,
// et laisse le pdfPermanent intact (depot en ajout).
export async function depositComplementAction(formData: FormData) {
  await requirePortalSession();
  const complementId = readString(formData, 'complementId');
  const candidatureId = readString(formData, 'candidatureId');
  const file = formData.get('fichier');

  const backTo = candidatureId ? `/candidatures/${candidatureId}/suivi` : '/mes-candidatures';

  if (!complementId || !(file instanceof File) || file.size === 0) {
    redirect(`${backTo}?error=complement`);
  }

  const uploaded = await uploadPortalFile(file as File);
  if (!uploaded) {
    redirect(`${backTo}?error=upload`);
  }

  const result = await depositComplement(complementId, (uploaded as { id: number }).id);
  redirect(`${backTo}?${result ? 'complement=depose' : 'error=depot'}`);
}
