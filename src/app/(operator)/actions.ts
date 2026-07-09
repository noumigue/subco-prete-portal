'use server';

import { redirect } from 'next/navigation';
import { clearPortalJwt, loginCandidate, registerCandidate, requestPasswordReset, resendConfirmation, resetPassword } from '@/lib/portal-auth';
import {
  createPortalDraft,
  deletePortalDraft,
  depositComplement,
  markNotificationRead,
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
  if (documentId) {
    await markNotificationRead(documentId);
  }
  redirect('/notifications');
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
