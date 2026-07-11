// Couche data du socle back-office M5 (espace de gestion).
// Les endpoints CMS `/api/gestion/*` sont gouvernes par le ROLE (instructeur / ugp),
// jamais owner-scopes. Meme cookie JWT que le portail operateur (primitive de login commune).

import { getPortalJwt } from './portal-auth';
import type {
  GestionAppel,
  GestionConsolidation,
  GestionDossierDetail,
  GestionDossierRow,
  GestionEvaluationAssign,
  GestionFicheDetail,
  GestionMesEvaluationRow,
} from './portal-types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

type Ok = { ok: boolean; error?: string };

async function gestionGet<T>(path: string): Promise<T | null> {
  const jwt = await getPortalJwt();
  if (!jwt) return null;
  const response = await fetch(`${STRAPI_URL}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

async function gestionPost(path: string, data?: unknown): Promise<Ok> {
  const jwt = await getPortalJwt();
  if (!jwt) return { ok: false, error: 'Session expiree.' };
  const response = await fetch(`${STRAPI_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: data !== undefined ? JSON.stringify({ data }) : undefined,
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!response.ok) return { ok: false, error: payload?.error?.message || "L'action a echoue." };
  return { ok: true };
}

// ——— Lectures ———
export async function getGestionDossiers(): Promise<GestionDossierRow[]> {
  const res = await gestionGet<{ data: GestionDossierRow[] }>('/api/gestion/dossiers');
  return res?.data || [];
}

export async function getGestionDossier(documentId: string): Promise<GestionDossierDetail | null> {
  const res = await gestionGet<{ data: GestionDossierDetail }>(`/api/gestion/dossiers/${documentId}`);
  return res?.data || null;
}

export async function getGestionAppels(): Promise<GestionAppel[]> {
  const res = await gestionGet<{ data: GestionAppel[] }>('/api/gestion/appels');
  return res?.data || [];
}

// ——— Nombre de propositions en attente de validation (badge sidebar ugp) ———
export async function getGestionPendingCount(): Promise<number> {
  const dossiers = await getGestionDossiers();
  return dossiers.filter((d) => d.enValidation).length;
}

// ——— Ecritures (circuit §4.2) ———
export const priseEnCharge = (documentId: string) => gestionPost(`/api/gestion/dossiers/${documentId}/prise-en-charge`);
export const reassigner = (documentId: string) => gestionPost(`/api/gestion/dossiers/${documentId}/reassigner`, {});

export const proposerCompletude = (
  documentId: string,
  data: { verdictsPieces: unknown; verdictGlobal: string; complementsProposes?: unknown; motifRejet?: string },
) => gestionPost(`/api/gestion/dossiers/${documentId}/completude/proposer`, data);
export const validerCompletude = (documentId: string, notificationDecisionFileId?: number) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/completude/valider`, notificationDecisionFileId ? { notificationDecisionFileId } : {});
export const renvoyerCompletude = (documentId: string, commentaire: string) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/completude/renvoyer`, { commentaire });

export const proposerEligibilite = (
  documentId: string,
  data: { verdictsCriteres: unknown; verdictGlobal: string; motifRejet?: string },
) => gestionPost(`/api/gestion/dossiers/${documentId}/eligibilite/proposer`, data);
export const validerEligibilite = (documentId: string, notificationDecisionFileId?: number) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/eligibilite/valider`, notificationDecisionFileId ? { notificationDecisionFileId } : {});
export const renvoyerEligibilite = (documentId: string, commentaire: string) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/eligibilite/renvoyer`, { commentaire });

export const ouvrirAppel = (documentId: string) => gestionPost(`/api/gestion/appels/${documentId}/ouvrir`);
export const cloreAppel = (documentId: string) => gestionPost(`/api/gestion/appels/${documentId}/clore`);

// ——— M5 phase 2 : évaluation & consolidation ———
export async function getMesEvaluations(): Promise<GestionMesEvaluationRow[]> {
  const res = await gestionGet<{ data: GestionMesEvaluationRow[] }>('/api/gestion/evaluations');
  return res?.data || [];
}
export async function getFicheDetail(documentId: string): Promise<GestionFicheDetail | null> {
  const res = await gestionGet<{ data: GestionFicheDetail }>(`/api/gestion/evaluations/${documentId}`);
  return res?.data || null;
}
export async function getEvaluationAssign(documentId: string): Promise<GestionEvaluationAssign | null> {
  const res = await gestionGet<{ data: GestionEvaluationAssign }>(`/api/gestion/dossiers/${documentId}/evaluation`);
  return res?.data || null;
}
export async function getConsolidation(documentId: string): Promise<GestionConsolidation | null> {
  const res = await gestionGet<{ data: GestionConsolidation }>(`/api/gestion/dossiers/${documentId}/consolidation`);
  return res?.data || null;
}

export const declarerCoi = (documentId: string) => gestionPost(`/api/gestion/evaluations/${documentId}/coi`);
export const recuser = (documentId: string) => gestionPost(`/api/gestion/evaluations/${documentId}/recuser`);
export const enregistrerFiche = (documentId: string, data: { esConforme?: boolean | null; notes?: unknown; bonus?: unknown }) =>
  gestionPost(`/api/gestion/evaluations/${documentId}/enregistrer`, data);
export const soumettreFiche = (documentId: string, data: { esConforme?: boolean | null; notes?: unknown; bonus?: unknown }) =>
  gestionPost(`/api/gestion/evaluations/${documentId}/soumettre`, data);

export const assignerEvaluateur = (documentId: string, evaluateurId: number, rang: number) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/evaluation/assigner`, { evaluateurId, rang });
export const harmoniser = (documentId: string, critereCode: string, noteRetenue: number) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/consolidation/harmoniser`, { critereCode, noteRetenue });
export const troisiemeEvaluateur = (documentId: string, evaluateurId: number) =>
  gestionPost(`/api/gestion/dossiers/${documentId}/consolidation/troisieme`, { evaluateurId });
export const figerConsolidation = (documentId: string) => gestionPost(`/api/gestion/dossiers/${documentId}/consolidation/figer`);
