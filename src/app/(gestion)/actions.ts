'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clearPortalJwt, getPortalSession, loginCandidate, requestPasswordReset } from '@/lib/portal-auth';
import { uploadPortalFile } from '@/lib/portal-api';
import {
  assignerEvaluateur,
  assistanceCreer,
  assistanceLiberer,
  assistancePrendre,
  assistanceRepondre,
  assistanceResoudre,
  getGestionAssistanceRattachements,
  cloreAppel,
  cloreSeance,
  conditionActionRequise,
  conditionAvisTechnique,
  conditionValider,
  decaissementAvisFiduciaire,
  decaissementAvisTechnique,
  declarerCoi,
  demanderComplementJustif,
  enregistrerFiche,
  figerConsolidation,
  genererPv,
  harmoniser,
  jalonDateReelle,
  joindrePvSigne,
  leverSubvention,
  mesureEmettre,
  mesureValider,
  ouvrirAppel,
  priseEnCharge,
  proposerCompletude,
  proposerEligibilite,
  publierDecisions,
  reassigner,
  recuser,
  renvoyerCompletude,
  renvoyerEligibilite,
  renvoyerRapport,
  saveDecision,
  saveRapportDossier,
  setNonObjection,
  setPresents,
  signerConvention,
  soumettreFiche,
  soumettreRapport,
  suspendreSubvention,
  troisiemeEvaluateur,
  validerCompletude,
  validerEligibilite,
  validerJustification,
  validerRapport,
} from '@/lib/gestion-api';

const INTERNAL_ROLES = new Set(['instructeur', 'ugp', 'comite']);

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
  // Le Comité (lecture cloisonnée) atterrit sur son dossier de séance, pas la file.
  redirect(session.role === 'comite' ? '/gestion/seance' : '/gestion/dossiers');
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

// ——— M5 phase 2 : évaluation (fiche de scoring, évaluateur) ———
type FichePayload = { esConforme?: boolean | null; notes?: unknown; bonus?: unknown };

export async function declarerCoiAction(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await declarerCoi(documentId);
  revalidatePath(`/gestion/evaluations/${documentId}`);
  return r;
}
export async function recuserAction(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await recuser(documentId);
  revalidatePath('/gestion/evaluations');
  return r;
}
export async function enregistrerFicheAction(documentId: string, data: FichePayload): Promise<{ ok: boolean; error?: string }> {
  return enregistrerFiche(documentId, data);
}
export async function soumettreFicheAction(documentId: string, data: FichePayload): Promise<{ ok: boolean; error?: string }> {
  const r = await soumettreFiche(documentId, data);
  revalidatePath('/gestion/evaluations');
  return r;
}

// ——— M5 phase 2 : assignation & consolidation (UGP) ———
export async function assignerEvaluateurAction(input: { documentId: string; evaluateurId: number; rang: number }): Promise<{ ok: boolean; error?: string }> {
  const r = await assignerEvaluateur(input.documentId, input.evaluateurId, input.rang);
  revalidatePath(`/gestion/dossiers/${input.documentId}/evaluation`);
  return r;
}
export async function harmoniserAction(input: { documentId: string; critereCode: string; noteRetenue: number }): Promise<{ ok: boolean; error?: string }> {
  const r = await harmoniser(input.documentId, input.critereCode, input.noteRetenue);
  revalidatePath(`/gestion/dossiers/${input.documentId}/consolidation`);
  return r;
}
export async function troisiemeEvaluateurAction(input: { documentId: string; evaluateurId: number }): Promise<{ ok: boolean; error?: string }> {
  const r = await troisiemeEvaluateur(input.documentId, input.evaluateurId);
  revalidatePath(`/gestion/dossiers/${input.documentId}/consolidation`);
  return r;
}
export async function figerConsolidationAction(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await figerConsolidation(documentId);
  revalidatePath(`/gestion/dossiers/${documentId}/consolidation`);
  return r;
}

// ——— M5 phase 2 temps 2 : rapport, Comité, décisions, publication ———
type Res = Promise<{ ok: boolean; error?: string }>;

export async function saveRapportDossierAction(appelId: string, data: unknown): Res {
  const r = await saveRapportDossier(appelId, data);
  revalidatePath('/gestion/rapport');
  return r;
}
export async function soumettreRapportAction(appelId: string): Res {
  const r = await soumettreRapport(appelId);
  revalidatePath('/gestion/rapport');
  return r;
}
export async function validerRapportAction(appelId: string): Res {
  const r = await validerRapport(appelId);
  revalidatePath('/gestion/rapport');
  return r;
}
export async function renvoyerRapportAction(appelId: string, commentaire: string): Res {
  const r = await renvoyerRapport(appelId, commentaire);
  revalidatePath('/gestion/rapport');
  return r;
}
export async function saveDecisionAction(appelId: string, data: { candidatureId: string; decisionComite: string; motifAjustement?: string }): Res {
  const r = await saveDecision(appelId, data);
  revalidatePath('/gestion/decisions');
  return r;
}
export async function setPresentsAction(appelId: string, presents: number): Res {
  const r = await setPresents(appelId, presents);
  revalidatePath('/gestion/decisions');
  return r;
}
export async function genererPvAction(appelId: string, data: { president?: string; lieu?: string; dateSeance?: string; reserves?: string }): Res {
  const r = await genererPv(appelId, data);
  revalidatePath('/gestion/decisions');
  return r;
}
export async function uploadFileAction(formData: FormData): Promise<{ id: number; name: string } | null> {
  const file = formData.get('fichier');
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadPortalFile(file);
}
export async function joindrePvSigneAction(appelId: string, fileId: number): Res {
  const r = await joindrePvSigne(appelId, fileId);
  revalidatePath('/gestion/decisions');
  return r;
}
export async function cloreSeanceAction(appelId: string): Res {
  const r = await cloreSeance(appelId);
  revalidatePath('/gestion/decisions');
  revalidatePath('/gestion/publication');
  return r;
}
export async function setNonObjectionAction(appelId: string, data: { requise?: boolean; action?: 'transmise' | 'accordee'; documentFileId?: number }): Res {
  const r = await setNonObjection(appelId, data);
  revalidatePath('/gestion/publication');
  return r;
}
export async function publierDecisionsAction(appelId: string): Res {
  const r = await publierDecisions(appelId);
  revalidatePath('/gestion/publication');
  return r;
}

// ——— M5 phase 3 : actes de subvention ———
function revalSub(id: string) { revalidatePath(`/gestion/subventions/${id}`); revalidatePath('/gestion/subventions'); }

export async function conditionAvisTechniqueAction(subId: string, condId: string, avisTechnique: string, commentaire: string): Res {
  const r = await conditionAvisTechnique(condId, avisTechnique, commentaire); revalSub(subId); return r;
}
export async function conditionValiderAction(subId: string, condId: string): Res {
  const r = await conditionValider(condId); revalSub(subId); return r;
}
export async function conditionActionRequiseAction(subId: string, condId: string, echeance?: string): Res {
  const r = await conditionActionRequise(condId, echeance); revalSub(subId); return r;
}
export async function signerConventionAction(subId: string, data: { numeroConvention?: string; dateSignature?: string; pdfConventionFileId?: number }): Res {
  const r = await signerConvention(subId, data); revalSub(subId); return r;
}
export async function decaissementAvisTechniqueAction(subId: string, decId: string, avisTechnique: string, commentaire: string): Res {
  const r = await decaissementAvisTechnique(decId, avisTechnique, commentaire); revalSub(subId); return r;
}
export async function decaissementAvisFiduciaireAction(subId: string, decId: string, data: { decision: string; commentaire?: string; acdFileId?: number }): Res {
  const r = await decaissementAvisFiduciaire(decId, data); revalSub(subId); return r;
}
export async function validerJustificationAction(subId: string, decId: string): Res {
  const r = await validerJustification(decId); revalSub(subId); return r;
}
export async function demanderComplementJustifAction(subId: string, decId: string): Res {
  const r = await demanderComplementJustif(decId); revalSub(subId); return r;
}
export async function jalonDateReelleAction(subId: string, jalonId: string, dateReelle: string): Res {
  const r = await jalonDateReelle(jalonId, dateReelle); revalSub(subId); return r;
}
export async function mesureEmettreAction(subId: string, data: { description: string; echeance?: string }): Res {
  const r = await mesureEmettre(subId, data); revalSub(subId); return r;
}
export async function mesureValiderAction(subId: string, mesureId: string): Res {
  const r = await mesureValider(mesureId); revalSub(subId); return r;
}
export async function suspendreSubventionAction(subId: string, motif: string): Res {
  const r = await suspendreSubvention(subId, motif); revalSub(subId); return r;
}
export async function leverSubventionAction(subId: string): Res {
  const r = await leverSubvention(subId); revalSub(subId); return r;
}

// ——— M5 phase 4 : assistance côté équipe ———
function revalAssist(id?: string) {
  if (id) revalidatePath(`/gestion/assistance/${id}`);
  revalidatePath('/gestion/assistance');
}

export async function prendreAssistanceAction(id: string): Res {
  const r = await assistancePrendre(id); revalAssist(id); return r;
}
export async function libererAssistanceAction(id: string): Res {
  const r = await assistanceLiberer(id); revalAssist(id); return r;
}
export async function repondreAssistanceEquipeAction(id: string, data: { corps: string; pieces?: number[] }): Res {
  const r = await assistanceRepondre(id, data); revalAssist(id); return r;
}
export async function resoudreAssistanceEquipeAction(id: string): Res {
  const r = await assistanceResoudre(id); revalAssist(id); return r;
}
export async function creerAssistanceOperateurAction(data: { operateurId: number; objet: string; corps: string; categorie?: string; concerneCandidature?: string; concerneSubvention?: string }): Res {
  const r = await assistanceCreer(data); revalAssist(); return r;
}
// Rattachements de l'opérateur choisi (formulaire H4) — lecture à la demande côté client.
export async function rattachementsOperateurAction(userId: number) {
  return getGestionAssistanceRattachements(userId);
}
