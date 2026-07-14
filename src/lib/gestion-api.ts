// Couche data du socle back-office M5 (espace de gestion).
// Les endpoints CMS `/api/gestion/*` sont gouvernes par le ROLE (instructeur / ugp),
// jamais owner-scopes. Meme cookie JWT que le portail operateur (primitive de login commune).

import { getPortalJwt } from './portal-auth';
import type {
  GestionAppel,
  GestionConsolidation,
  GestionDecisions,
  GestionDossierDetail,
  GestionDossierRow,
  GestionEvaluationAssign,
  GestionFicheDetail,
  GestionMesEvaluationRow,
  GestionPublication,
  GestionRapport,
  GestionSeance,
  GestionSubventionDetail,
  GestionSubventionRow,
  GestionAssistanceRow,
  GestionAssistanceDetail,
  GestionAssistanceOperateur,
  GestionAssistanceRattachements,
  GestionNoRow,
  GestionNoDetail,
  GestionNoCas,
  GestionNoPaquet,
  GestionSeTableauDeBord,
  GestionSeIndicateur,
  GestionSeDepouillement,
  GestionSeRapport,
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

// ——— M5 phase 2 temps 2 : rapport, Comité, décisions, publication ———

// Résout l'appel « courant » (ouvert, sinon le premier) pour les écrans par cohorte.
export async function getCurrentAppelId(): Promise<string | null> {
  const appels = await getGestionAppels();
  const ouvert = appels.find((a) => a.statut === 'ouvert');
  return (ouvert || appels[0])?.documentId || null;
}

// Résout la cohorte à afficher : celle demandée en query (si valide) sinon la cohorte
// courante (ouverte). Permet de consulter une cohorte passée quand il y en a plusieurs.
export async function resolveAppelId(preferId?: string): Promise<string | null> {
  if (preferId) {
    const appels = await getGestionAppels();
    if (appels.some((a) => a.documentId === preferId)) return preferId;
  }
  return getCurrentAppelId();
}

export async function getRapport(appelId: string): Promise<GestionRapport | null> {
  const res = await gestionGet<{ data: GestionRapport }>(`/api/gestion/appels/${appelId}/rapport`);
  return res?.data || null;
}
export async function getSeance(appelId: string): Promise<GestionSeance | null> {
  const res = await gestionGet<{ data: GestionSeance }>(`/api/gestion/appels/${appelId}/seance`);
  return res?.data || null;
}
// Séance « courante » — résolue côté serveur (le Comité n'a pas accès à la liste des appels, F2).
export async function getSeanceCourante(): Promise<GestionSeance | null> {
  const res = await gestionGet<{ data: GestionSeance }>('/api/gestion/seance-courante');
  return res?.data || null;
}
export async function getDecisions(appelId: string): Promise<GestionDecisions | null> {
  const res = await gestionGet<{ data: GestionDecisions }>(`/api/gestion/appels/${appelId}/decisions`);
  return res?.data || null;
}
export async function getPublication(appelId: string): Promise<GestionPublication | null> {
  const res = await gestionGet<{ data: GestionPublication }>(`/api/gestion/appels/${appelId}/publication`);
  return res?.data || null;
}

export const saveRapportDossier = (appelId: string, data: unknown) => gestionPost(`/api/gestion/appels/${appelId}/rapport/dossier`, data);
export const soumettreRapport = (appelId: string) => gestionPost(`/api/gestion/appels/${appelId}/rapport/soumettre`);
export const validerRapport = (appelId: string) => gestionPost(`/api/gestion/appels/${appelId}/rapport/valider`);
export const renvoyerRapport = (appelId: string, commentaire: string) => gestionPost(`/api/gestion/appels/${appelId}/rapport/renvoyer`, { commentaire });

export const saveDecision = (appelId: string, data: { candidatureId: string; decisionComite: string; motifAjustement?: string }) => gestionPost(`/api/gestion/appels/${appelId}/decisions/dossier`, data);
export const setPresents = (appelId: string, presents: number) => gestionPost(`/api/gestion/appels/${appelId}/decisions/presents`, { presents });
export const genererPv = (appelId: string, data: { president?: string; lieu?: string; dateSeance?: string; reserves?: string }) => gestionPost(`/api/gestion/appels/${appelId}/decisions/pv`, data);
export const joindrePvSigne = (appelId: string, pvSigneFileId: number) => gestionPost(`/api/gestion/appels/${appelId}/decisions/pv-signe`, { pvSigneFileId });
export const cloreSeance = (appelId: string) => gestionPost(`/api/gestion/appels/${appelId}/decisions/clore`);

export const setNonObjection = (appelId: string, data: { requise?: boolean; action?: 'transmise' | 'accordee'; documentFileId?: number }) => gestionPost(`/api/gestion/appels/${appelId}/publication/non-objection`, data);
export const publierDecisions = (appelId: string) => gestionPost(`/api/gestion/appels/${appelId}/publication/publier`);

// ——— M5 phase 3 : actes de subvention (côté UGP/Cabinet) ———
export async function getGestionSubventions(): Promise<GestionSubventionRow[]> {
  const res = await gestionGet<{ data: GestionSubventionRow[] }>('/api/gestion/subventions');
  return res?.data || [];
}
export async function getGestionSubvention(documentId: string): Promise<GestionSubventionDetail | null> {
  const res = await gestionGet<{ data: GestionSubventionDetail }>(`/api/gestion/subventions/${documentId}`);
  return res?.data || null;
}
// Conditions (G1)
export const conditionAvisTechnique = (id: string, avisTechnique: string, commentaire?: string) =>
  gestionPost(`/api/gestion/conditions/${id}/avis-technique`, { avisTechnique, commentaire });
export const conditionValider = (id: string) => gestionPost(`/api/gestion/conditions/${id}/valider`, {});
export const conditionActionRequise = (id: string, echeance?: string) => gestionPost(`/api/gestion/conditions/${id}/action-requise`, { echeance });
// Signature (G2)
export const signerConvention = (id: string, data: { numeroConvention?: string; dateSignature?: string; pdfConventionFileId?: number }) =>
  gestionPost(`/api/gestion/subventions/${id}/signer`, data);
// Décaissements (G3/G4)
export const decaissementAvisTechnique = (id: string, avisTechnique: string, commentaire?: string) =>
  gestionPost(`/api/gestion/decaissements/${id}/avis-technique`, { avisTechnique, commentaire });
export const decaissementAvisFiduciaire = (id: string, data: { decision: string; commentaire?: string; acdFileId?: number }) =>
  gestionPost(`/api/gestion/decaissements/${id}/avis-fiduciaire`, data);
export const validerJustification = (id: string) => gestionPost(`/api/gestion/decaissements/${id}/valider-justification`, {});
export const demanderComplementJustif = (id: string) => gestionPost(`/api/gestion/decaissements/${id}/demander-complement`, {});
// Jalons (G5)
export const jalonDateReelle = (id: string, dateReelle: string) => gestionPost(`/api/gestion/jalons/${id}/date-reelle`, { dateReelle });
// Mesures + suspension (G6)
export const mesureEmettre = (subventionId: string, data: { description: string; echeance?: string }) => gestionPost(`/api/gestion/subventions/${subventionId}/mesures`, data);
export const mesureValider = (id: string) => gestionPost(`/api/gestion/mesures/${id}/valider`, {});
export const suspendreSubvention = (id: string, motif?: string) => gestionPost(`/api/gestion/subventions/${id}/suspendre`, { motif });
export const leverSubvention = (id: string) => gestionPost(`/api/gestion/subventions/${id}/lever`, {});

// ——— M5 phase 4 : assistance côté équipe (§19) ———
export async function getGestionAssistance(): Promise<GestionAssistanceRow[]> {
  const res = await gestionGet<{ data: GestionAssistanceRow[] }>('/api/gestion/assistance');
  return res?.data || [];
}
export async function getGestionAssistanceDetail(documentId: string): Promise<GestionAssistanceDetail | null> {
  const res = await gestionGet<{ data: GestionAssistanceDetail }>(`/api/gestion/assistance/${documentId}`);
  return res?.data || null;
}
export async function getGestionAssistanceOperateurs(): Promise<GestionAssistanceOperateur[]> {
  const res = await gestionGet<{ data: GestionAssistanceOperateur[] }>('/api/gestion/assistance/operateurs');
  return res?.data || [];
}
export async function getGestionAssistanceRattachements(userId: number): Promise<GestionAssistanceRattachements> {
  const res = await gestionGet<{ data: GestionAssistanceRattachements }>(`/api/gestion/assistance/operateurs/${userId}/rattachements`);
  return res?.data || { candidatures: [], subventions: [] };
}
// H1 — « prendre » sert aussi de « reprendre » (pas de blocage).
export const assistancePrendre = (id: string) => gestionPost(`/api/gestion/assistance/${id}/prendre`, {});
export const assistanceLiberer = (id: string) => gestionPost(`/api/gestion/assistance/${id}/liberer`, {});
export const assistanceRepondre = (id: string, data: { corps: string; pieces?: number[] }) => gestionPost(`/api/gestion/assistance/${id}/repondre`, data);
export const assistanceResoudre = (id: string) => gestionPost(`/api/gestion/assistance/${id}/resoudre`, {});
export const assistanceCreer = (data: { operateurId: number; objet: string; corps: string; categorie?: string; concerneCandidature?: string; concerneSubvention?: string }) =>
  gestionPost('/api/gestion/assistance', data);

// ——— M5 phase 5 : non-objection outillée (§6.7) ———
export async function getGestionNonObjections(): Promise<GestionNoRow[]> {
  const res = await gestionGet<{ data: GestionNoRow[] }>('/api/gestion/non-objection');
  return res?.data || [];
}
export async function getGestionNonObjection(documentId: string): Promise<GestionNoDetail | null> {
  const res = await gestionGet<{ data: GestionNoDetail }>(`/api/gestion/non-objection/${documentId}`);
  return res?.data || null;
}
export async function getGestionNonObjectionCas(): Promise<GestionNoCas[]> {
  const res = await gestionGet<{ data: GestionNoCas[] }>('/api/gestion/non-objection/cas');
  return res?.data || [];
}
export async function getGestionNonObjectionPaquet(documentId: string): Promise<GestionNoPaquet> {
  const res = await gestionGet<{ data: GestionNoPaquet }>(`/api/gestion/non-objection/${documentId}/paquet`);
  return res?.data || { files: [] };
}
export const creerNonObjection = (data: { casDocumentId: string; objet: string; reference?: string; demandeRedigeeFileId?: number }) =>
  gestionPost('/api/gestion/non-objection', data);
export const majSyntheseNonObjection = (id: string, data: { recalculer?: boolean; valeurs?: { recus: number; complets: number; eligibles: number; evalues: number; recommandes: number } }) =>
  gestionPost(`/api/gestion/non-objection/${id}/synthese`, data);
export const joindrePieceNonObjection = (id: string, slot: 'es' | 'fiduciaire', fileId: number) =>
  gestionPost(`/api/gestion/non-objection/${id}/piece`, { slot, fileId });
export const genererNonObjection = (id: string, data: { lieu?: string; date?: string; signataire?: string }) =>
  gestionPost(`/api/gestion/non-objection/${id}/generer`, data);
export const transmettreNonObjection = (id: string) => gestionPost(`/api/gestion/non-objection/${id}/transmettre`, {});
export const accordNonObjection = (id: string, documentFileId: number) => gestionPost(`/api/gestion/non-objection/${id}/accord`, { documentFileId });
export const observationsNonObjection = (id: string, observations: string) => gestionPost(`/api/gestion/non-objection/${id}/observations`, { observations });
export const reversionNonObjection = (id: string, ajustements: string) => gestionPost(`/api/gestion/non-objection/${id}/reversion`, { ajustements });

// ——— M6 : suivi-évaluation (§14) ———
function coh(cohorte?: string) { return cohorte && cohorte !== 'toutes' ? `?cohorte=${encodeURIComponent(cohorte)}` : ''; }
export async function getSeTableauDeBord(cohorte?: string): Promise<GestionSeTableauDeBord | null> {
  const res = await gestionGet<{ data: GestionSeTableauDeBord }>(`/api/gestion/se/tableau-de-bord${coh(cohorte)}`);
  return res?.data || null;
}
export async function getSeIndicateurs(cohorte?: string): Promise<GestionSeIndicateur[]> {
  const res = await gestionGet<{ data: GestionSeIndicateur[] }>(`/api/gestion/se/indicateurs${coh(cohorte)}`);
  return res?.data || [];
}
export async function getSeDepouillements(cohorte?: string): Promise<GestionSeDepouillement[]> {
  const res = await gestionGet<{ data: GestionSeDepouillement[] }>(`/api/gestion/se/depouillements${coh(cohorte)}`);
  return res?.data || [];
}
export async function getSeRapports(): Promise<GestionSeRapport[]> {
  const res = await gestionGet<{ data: GestionSeRapport[] }>('/api/gestion/se/rapports');
  return res?.data || [];
}
export const seDepouillementProposer = (id: string, valeurs: Record<string, unknown>) => gestionPost(`/api/gestion/se/depouillements/${id}/proposer`, { valeurs });
export const seDepouillementValider = (id: string) => gestionPost(`/api/gestion/se/depouillements/${id}/valider`, {});
export const seDepouillementRenvoyer = (id: string) => gestionPost(`/api/gestion/se/depouillements/${id}/renvoyer`, {});
export const seGenererRapport = (data: { periode: string; cohorteLabel: string; cohorte?: string }) => gestionPost('/api/gestion/se/rapports', data);
