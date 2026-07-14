export type PortalRole = 'candidat' | 'beneficiaire' | 'instructeur' | 'ugp' | 'comite' | 'banque' | 'authenticated';

export type PortalSession = {
  userId: number;
  orgName: string;
  email: string;
  emailVerified: boolean;
  phone?: string | null;
  role: PortalRole;
  // M7 L1 — porteur du drapeau de gouvernance des comptes internes (back-office).
  adminComptes?: boolean;
};

export type PortalAppel = {
  id: number;
  documentId: string;
  nom?: string;
  codeCohorte?: string;
  ouvertLe?: string;
  clotureLe?: string;
  statut?: 'ouvert' | 'ferme' | 'a_venir';
};

export type PortalStatus = {
  id: number;
  documentId: string;
  code?: string;
  libelleCandidat?: string;
  groupe?: 'brouillon' | 'en_instruction' | 'selectionne' | 'non_retenu';
  phase?: 'recu' | 'completude' | 'eligibilite' | 'evaluation' | 'decision';
  ordre?: number;
};

export type PortalOrganisation = {
  id: number;
  documentId: string;
  nom?: string;
  adresse?: string;
  telephone?: string;
  contact?: string;
  province?: { nom?: string } | null;
  commune?: { nom?: string } | null;
  filierePrincipale?: { nom?: string } | null;
  statutJuridique?: { libelle?: string } | null;
};

export type PortalComplement = {
  id: number;
  documentId: string;
  pieceDemandee?: string;
  echeance?: string;
  statut?: 'demande' | 'fourni';
  fichier?: { url?: string } | null;
};

export type PortalNotification = {
  id: number;
  documentId: string;
  canal?: 'email' | 'sms' | 'both';
  sujet?: string;
  corps?: string;
  envoyeLe?: string;
  lu?: boolean;
  candidature?: { documentId?: string } | null;
};

export type PortalCandidature = {
  id: number;
  documentId: string;
  titreProjet?: string;
  numeroDossier?: string | null;
  dateDepot?: string | null;
  donneesProjet?: unknown;
  motifDecisionCourt?: string | null;
  appel?: PortalAppel | null;
  organisation?: PortalOrganisation | null;
  statut?: PortalStatus | null;
  complements?: PortalComplement[];
  notifications?: PortalNotification[];
  pdfPermanent?: { url?: string } | null;
  notificationDecision?: { url?: string } | null;
};

export type PortalStatutJuridique = {
  id: number;
  documentId: string;
  libelle?: string;
  ordre?: number;
};

export type PortalFiliere = {
  id: number;
  documentId: string;
  nom?: string;
  slug?: string;
  transversal?: boolean;
};

export type PortalTypeContrepartie = {
  id: number;
  documentId: string;
  libelle?: string;
  ordre?: number;
};

type PortalBlockChild = { type?: string; text?: string };
type PortalBlock = { type?: string; children?: PortalBlockChild[] };

export type PortalContenuAide = {
  id: number;
  documentId: string;
  cle?: string;
  titre?: string;
  corps?: PortalBlock[];
};

// FAQ editoriale existante (content-type `faq-item`, partagee avec le site public).
export type PortalFaqItem = {
  id: number;
  documentId: string;
  question?: string;
  reponse?: PortalBlock[];
  theme?: string;
  ordre?: number;
};

export type PortalDocumentTelechargeable = {
  id: number;
  documentId: string;
  titre?: string;
  ordre?: number;
  fichier?: { url?: string } | null;
};

export type PortalCommune = {
  id: number;
  documentId: string;
  nom?: string;
};

export type PortalProvince = {
  id: number;
  documentId: string;
  nom?: string;
  code?: string;
  anciensNoms?: string[] | null;
  communes?: PortalCommune[];
};

export type PortalTypePiece = {
  id: number;
  documentId: string;
  libelle?: string;
  groupe?: 'administratif' | 'financier' | 'technique';
  exigence?: 'obligatoire' | 'si_applicable' | 'si_disponible';
  ordre?: number;
};

// Contrat de donnees du brouillon Module 3 (candidature.donneesProjet).
// Lu/ecrit par le formulaire, valide cote CMS a la soumission, rendu dans les PDF.
export type PortalPieceDepot = {
  id: string;
  libelle: string;
  groupe: string;
  exigence: string;
  depose?: boolean;
  fileId?: number | null;
  nomFichier?: string | null;
};

export type PortalDonneesProjet = {
  etape?: number;
  eligibilite?: { libelle: string; confirme: boolean }[];
  operateur?: { nif?: string; rc?: string; email?: string; telephone?: string };
  projet?: {
    filiereId?: string | null;
    filiere?: string;
    typeInfrastructure?: string;
    memeSiege?: boolean;
    siteProvinceId?: string | null;
    siteProvince?: string;
    siteCommuneId?: string | null;
    siteCommune?: string;
    statutSite?: string;
    usageCollectif?: string;
    mpmeDesservies?: string;
    maturite?: string;
    noteConceptuelle?: string;
  };
  financement?: {
    budgetTotal?: number;
    contrepartie?: number;
    typeContrepartie?: string;
    modeleEconomique?: string;
  };
  impact?: {
    mpme?: string;
    femmes?: string;
    jeunes?: string;
    refugies?: string;
    emplois?: string;
    porteParFemme?: string;
    zoneRurale?: string;
  };
  es?: {
    reponses?: { libelle: string; reponse: string }[];
    risqueDeclare?: boolean;
    pges?: { fileId?: number; nomFichier?: string } | null;
  };
  pieces?: PortalPieceDepot[];
};

// ——— Ma subvention (Lot 2) ———

export type PortalMedia = { url?: string; name?: string } | null;

export type PortalConditionPrealable = {
  documentId: string;
  libelle?: string;
  statut?: 'validee' | 'en_cours_ugp' | 'action_requise';
  echeance?: string | null;
  dateValidation?: string | null;
  fichierDepose?: PortalMedia;
  ordre?: number;
};

export type PortalDocumentContractuel = {
  documentId: string;
  lettre?: string;
  titre?: string;
  fichier?: PortalMedia;
};

export type PortalJalonProjet = {
  documentId: string;
  etape?: { code?: string; libelle?: string } | null;
  datePrevue?: string | null;
  dateReelle?: string | null;
  ordre?: number;
};

export type PortalRapportRequis = {
  documentId: string;
  type?: { code?: string; libelle?: string } | null;
  periodeLibelle?: string;
  echeance?: string | null;
  statut?: 'a_venir' | 'echu' | 'transmis';
  fichier?: PortalMedia;
  dateTransmission?: string | null;
  ordre?: number;
};

export type PortalMesureCorrective = {
  documentId: string;
  description?: string;
  echeance?: string | null;
  statut?: 'en_cours' | 'regularisee';
  fichierRegularisation?: PortalMedia;
};

export type PortalModalite = {
  documentId: string;
  code?: string;
  libelle?: string;
  piecesRequises?: string[];
  piecesJustification?: string[];
  ordre?: number;
};

export type PortalDemandeDecaissement = {
  documentId: string;
  numero?: number;
  modalite?: PortalModalite | null;
  montant?: string | number | null;
  objet?: string;
  pieces?: PortalMedia[];
  statut?: { code?: string; libelleBeneficiaire?: string } | null;
  avisTechnique?: string | null;
  avisFiduciaire?: string | null;
  motifRejet?: string | null;
  aJustifier?: boolean;
  justificationPieces?: PortalMedia[];
  justificationStatut?: 'non_requise' | 'attendue' | 'soumise' | 'validee';
};

export type PortalSubvention = {
  documentId: string;
  numeroConvention?: string | null;
  statut?: 'preparation' | 'active' | 'suspendue' | 'cloturee';
  dateSignature?: string | null;
  montantTotal?: string | number | null;
  montantSubvention?: string | number | null;
  montantContrepartie?: string | number | null;
  montantDecaisse?: string | number | null;
  pdfConvention?: PortalMedia;
  avenants?: PortalMedia[];
  candidature?: { documentId?: string; titreProjet?: string; donneesProjet?: unknown } | null;
  documentsContractuels?: PortalDocumentContractuel[];
  conditionsPrealables?: PortalConditionPrealable[];
  jalons?: PortalJalonProjet[];
  rapports?: PortalRapportRequis[];
  mesuresCorrectives?: PortalMesureCorrective[];
  demandes?: PortalDemandeDecaissement[];
};

// ——— Assistance (canal bidirectionnel) ———

export type PortalCategorieAssistance = {
  documentId: string;
  code?: string;
  libelle?: string;
  ordre?: number;
};

export type PortalMessageAssistance = {
  documentId: string;
  auteur?: 'operateur' | 'equipe';
  corps?: string;
  pieces?: { url?: string; name?: string }[];
  envoyeLe?: string;
};

export type PortalDemandeAssistance = {
  documentId: string;
  objet?: string;
  categorie?: { libelle?: string; code?: string } | null;
  concerneCandidature?: { documentId?: string; numeroDossier?: string | null; titreProjet?: string } | null;
  concerneSubvention?: { documentId?: string; numeroConvention?: string | null } | null;
  statut?: 'ouverte' | 'en_cours' | 'resolue';
  origine?: 'operateur' | 'ugp';
  resolueLe?: string | null;
  resoluePar?: 'operateur' | 'equipe' | null;
  messages?: PortalMessageAssistance[];
  updatedAt?: string;
};

export type PortalResourceDocument = {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  file?: { url?: string } | null;
};

// ——— Socle back-office M5 (espace de gestion) ———

export type GestionDossierRow = {
  documentId: string;
  numeroDossier: string | null;
  titreProjet: string;
  dateDepot: string | null;
  organisation: { nom: string; filiere: string | null } | null;
  statut: { code?: string; phase?: string; groupe?: string; libelle?: string } | null;
  prisEnChargePar: { id: number; nom: string } | null;
  enValidation: boolean;
  enValidationPhase: 'completude' | 'eligibilite' | null;
  complementEnCours: boolean;
  complementRecu?: boolean;
  statutClos: string | null;
};

export type GestionComplement = {
  documentId: string;
  pieceDemandee: string;
  echeance: string | null;
  statut: 'demande' | 'fourni';
  fichierUrl: string | null;
  fourniLe: string | null;
};

export type GestionInstructionCompletude = {
  documentId: string;
  verdictsPieces: Record<string, { etat: 'presente' | 'absente' | 'non_conforme'; note?: string }>;
  verdictGlobal: 'complet' | 'complements' | 'rejet' | null;
  complementsProposes: { pieces?: string[]; echeance?: string; message?: string } | null;
  motifRejet: string | null;
  workflow: 'en_cours' | 'propose' | 'valide' | 'renvoye';
  proposePar: string | null;
  commentaireRenvoi: string | null;
};

export type GestionInstructionEligibilite = {
  documentId: string;
  verdictsCriteres: Record<string, { etat: 'conforme' | 'non_conforme'; justification?: string }>;
  verdictGlobal: 'eligible' | 'rejet' | null;
  motifRejet: string | null;
  workflow: 'en_cours' | 'propose' | 'valide' | 'renvoye';
  proposePar: string | null;
  commentaireRenvoi: string | null;
};

export type GestionReferentiels = {
  typePieces: { id: string; libelle: string; groupe: string; exigence: string }[];
  criteres: { id: string; libelle: string; refManuel: string | null }[];
  delaiComplementsJours: number;
};

export type GestionActe = { date: string | null; auteur: string; texte: string };

export type GestionDossierDetail = GestionDossierRow & {
  donneesProjet: unknown;
  motifDecisionCourt: string | null;
  pdfPermanentUrl: string | null;
  notificationDecisionUrl: string | null;
  instructionCompletude: GestionInstructionCompletude | null;
  instructionEligibilite: GestionInstructionEligibilite | null;
  referentiels: GestionReferentiels;
  journal: GestionActe[];
  complements?: GestionComplement[];
};

export type GestionAppel = {
  documentId: string;
  nom?: string;
  codeCohorte?: string;
  statut?: 'ouvert' | 'ferme' | 'a_venir';
  ouvertLe?: string | null;
  clotureLe?: string | null;
};

// ——— M5 phase 2 : évaluation & consolidation ———

export type GestionBaremeCritere = {
  code: string;
  bloc: 'A' | 'B' | 'bonus';
  libelle: string;
  description: string;
  points: number;
  type: 'note' | 'eliminatoire';
};

export type GestionMesEvaluationRow = {
  documentId: string;
  numeroDossier: string | null;
  organisation: { nom: string; filiere: string | null } | null;
  rang: number;
  ficheStatut: 'brouillon' | 'soumise' | null;
};

export type GestionFicheDetail = {
  documentId: string;
  numeroDossier: string | null;
  organisation: { nom: string; filiere: string | null } | null;
  pdfPermanentUrl: string | null;
  rang: number;
  fiche: {
    coiDeclare: boolean;
    esConforme: boolean | null;
    notes: Record<string, { note: number; commentaire?: string }>;
    bonus: Record<string, number>;
    statut: 'brouillon' | 'soumise';
    signeLe: string | null;
  } | null;
  bareme: { blocA: GestionBaremeCritere[]; blocB: GestionBaremeCritere[]; bonus: GestionBaremeCritere[]; porteEs: GestionBaremeCritere | null };
  parametres: { seuilBase: number; bandes: { min: number; label: string }[] };
};

export type GestionEvaluateurSlot = { evaluateurId: number | null; nom: string | null; ficheStatut: 'brouillon' | 'soumise' | null } | null;

export type GestionEvaluationAssign = {
  documentId: string;
  numeroDossier: string | null;
  organisation: { nom: string; filiere: string | null } | null;
  evaluateur1: GestionEvaluateurSlot;
  evaluateur2: GestionEvaluateurSlot;
  evaluateur3: GestionEvaluateurSlot;
  evaluateurs: { id: number; nom: string }[];
  consolidationPrete: boolean;
  consolidationStatut: 'en_cours' | 'figee' | null;
};

export type GestionConsolidationRow = {
  code: string;
  libelle: string;
  points: number;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  seuil: number;
  ecart: number;
  gap: boolean;
  traite: boolean;
  harmonisee: boolean;
  retenue: number;
};

export type GestionConsolidationTotals = {
  totalA: number;
  totalB: number;
  bonus: number;
  totalHorsBonus: number;
  totalFinal: number;
  bande: string;
};

export type GestionConsolidation = {
  ready: boolean;
  documentId?: string;
  numeroDossier?: string | null;
  organisation?: { nom: string } | null;
  evaluateur1Nom?: string;
  evaluateur2Nom?: string;
  aTroisieme?: boolean;
  rows?: { blocA: GestionConsolidationRow[]; blocB: GestionConsolidationRow[] };
  bonusRows?: GestionConsolidationRow[];
  totals?: GestionConsolidationTotals;
  ecartsNonTraites?: { code: string; libelle: string; ecart: number; seuil: number }[];
  ecartPct?: number;
  statut?: 'en_cours' | 'figee';
  evaluateurs?: { id: number; nom: string }[];
};

// ——— M5 phase 2 temps 2 : rapport, Comité, décisions, publication ———

export type GestionCondition = { texte: string; type?: 'plan_affaires' | 'site' | 'es' | 'autre' };

export type GestionRapportDossier = {
  candidatureId: string;
  rang: number;
  num: string | null;
  op: string;
  proj: string;
  totalA: number;
  totalB: number;
  bonus: number;
  totalHorsBonus: number;
  totalFinal: number;
  bande: string;
  hasHarmon: boolean;
  reco: 'selection' | 'conditionnelle' | 'attente' | 'rejet';
  motifReco: string | null;
  conditions: GestionCondition[];
  forces: string[];
  faiblesses: string[];
  decisionComite: 'retenu' | 'conditions' | 'rejete' | 'attente' | null;
};

export type GestionRapport = {
  appel: { documentId: string; nom?: string; codeCohorte?: string };
  statut: 'brouillon' | 'soumis' | 'valide';
  commentaireRenvoi: string | null;
  pdfUrl: string | null;
  dossiers: GestionRapportDossier[];
};

export type GestionSeance = {
  ready: boolean;
  appel?: { documentId: string; nom?: string; codeCohorte?: string };
  rapportPdfUrl?: string | null;
  dossiers?: { rang: number; op: string; proj: string; totalFinal: number; totalA: number; totalB: number; bonus: number; bande: string; reco: string; forces: string[]; faiblesses: string[]; conditions: GestionCondition[] }[];
};

export type GestionDecisionsDossier = {
  candidatureId: string;
  num: string | null;
  op: string;
  proj: string;
  totalFinal: number;
  reco: 'selection' | 'conditionnelle' | 'attente' | 'rejet';
  decisionComite: 'retenu' | 'conditions' | 'rejete' | 'attente' | null;
  motifAjustement: string | null;
};

export type GestionDecisions = {
  ready: boolean;
  appel?: { documentId: string; nom?: string; codeCohorte?: string };
  parametres?: { nbMembres: number; quorumSeuil: number };
  presents?: number;
  statut?: 'ouverte' | 'close';
  pvGenereUrl?: string | null;
  pvSigneUrl?: string | null;
  dossiers?: GestionDecisionsDossier[];
};

export type GestionPublication = {
  seanceClose: boolean;
  publiee: boolean;
  nonObjection: { requise: boolean; statut: 'a_demander' | 'en_preparation' | 'transmise' | 'accordee' | 'observations'; dateAccord: string | null };
  pvSigne: boolean;
  appel: { documentId: string; nom?: string; codeCohorte?: string };
  dossiers: { op: string; decisionComite: string | null }[];
};

// ——— M5 phase 3 : actes de subvention (côté UGP/Cabinet) ———

export type GestionSubventionStatut = 'preparation' | 'active' | 'suspendue' | 'cloturee';

export type GestionSubventionRow = {
  documentId: string;
  numeroConvention: string | null;
  op: string;
  proj: string;
  statut: GestionSubventionStatut;
  montantSubvention: string | null;
  montantTotal: string | null;
};

export type GestionSubCondition = {
  documentId: string;
  libelle: string;
  statut: 'validee' | 'en_cours_ugp' | 'action_requise';
  echeance: string | null;
  ordre: number;
  technique: boolean;
  avisTechnique: 'favorable' | 'reserve' | 'defavorable' | null;
  avisTechniqueCommentaire: string | null;
  avisTechniquePar: string | null;
  valideePar: string | null;
  valideeLe: string | null;
};

export type GestionPiece = { name?: string; url?: string };

export type GestionDemande = {
  documentId: string;
  numero: number;
  montant: string | null;
  objet: string | null;
  modalite: string | null;
  modaliteCode: string | null;
  statut: string | null;
  statutLibelle: string | null;
  avisTechnique: string | null;
  avisTechniqueCommentaire: string | null;
  avisFiduciaire: string | null;
  motifRejet: string | null;
  aJustifier: boolean;
  justificationStatut: 'non_requise' | 'attendue' | 'soumise' | 'validee';
  pieces: GestionPiece[];
  justificationPieces: GestionPiece[];
  acdUrl: string | null;
};

export type GestionJalon = { documentId: string; libelle: string; datePrevue: string | null; dateReelle: string | null };
export type GestionMesure = { documentId: string; description: string; echeance: string | null; statut: 'en_cours' | 'regularisee' };
export type GestionRapportRecu = { type: string; periode: string | null; statut: string; dateTransmission: string | null };

export type GestionSubventionDetail = GestionSubventionRow & {
  dateSignature: string | null;
  montantContrepartie: string | null;
  montantDecaisse: string | null;
  motifSuspension: string | null;
  pdfConventionUrl: string | null;
  conditions: GestionSubCondition[];
  demandes: GestionDemande[];
  jalons: GestionJalon[];
  mesures: GestionMesure[];
  rapports: GestionRapportRecu[];
};

// ——— M5 phase 4 : assistance côté équipe (§19) ———

export type GestionAssistanceStatut = 'ouverte' | 'en_cours' | 'resolue';

export type GestionAssistanceRow = {
  documentId: string;
  objet: string;
  statut: GestionAssistanceStatut;
  origine: 'operateur' | 'ugp';
  operateur: string;
  categorie: { code?: string; libelle?: string } | null;
  concerneCandidature: { documentId: string; numeroDossier: string | null; titreProjet: string | null } | null;
  concerneSubvention: { documentId: string; numeroConvention: string | null } | null;
  priseEnChargePar: { id: number; nom: string } | null;
  updatedAt: string | null;
  dernierAuteur: 'operateur' | 'equipe' | null;
  dernierLe: string | null;
};

export type GestionAssistanceMessage = {
  auteur: 'operateur' | 'equipe';
  corps: string;
  envoyeLe: string | null;
  pieces: { url?: string; name?: string }[];
};

export type GestionAssistanceDetail = GestionAssistanceRow & {
  resolueLe: string | null;
  resoluePar: 'operateur' | 'equipe' | null;
  messages: GestionAssistanceMessage[];
};

export type GestionAssistanceOperateur = { id: number; nom: string; email: string; role: string };

export type GestionAssistanceRattachements = {
  candidatures: { documentId: string; numeroDossier: string | null; titreProjet: string }[];
  subventions: { documentId: string; numeroConvention: string | null; statut: string }[];
};

// ——— M5 phase 5 : non-objection outillée (§6.7) ———

export type GestionNoStatut = 'en_preparation' | 'transmise' | 'accordee' | 'observations';
export type GestionNoCas = { documentId: string; code: string; libelle: string };
export type GestionNoMedia = { url?: string; name?: string } | null;

export type GestionNoRow = {
  documentId: string;
  objet: string;
  type: { code?: string; libelle?: string } | null;
  reference: string | null;
  statut: GestionNoStatut;
  version: number;
  selection: boolean;
  requise: boolean;
  dateTransmission: string | null;
  dateAccord: string | null;
};

export type GestionNoSynthese = { recus: number; complets: number; eligibles: number; evalues: number; recommandes: number };

export type GestionNoVersion = {
  version: number;
  dateTransmission: string | null;
  observations: string | null;
  ajustements: string | null;
  demandePdf: GestionNoMedia;
};

export type GestionNoDetail = GestionNoRow & {
  appel: { documentId: string; nom?: string; codeCohorte?: string } | null;
  synthese: GestionNoSynthese;
  pieces: { rapport: GestionNoMedia; pvSigne: GestionNoMedia; es: GestionNoMedia; fiduciaire: GestionNoMedia };
  demandePdf: GestionNoMedia;
  demandeRedigee: GestionNoMedia;
  document: GestionNoMedia;
  observations: string | null;
  ajustements: string | null;
  dateObservations: string | null;
  versions: GestionNoVersion[];
};

export type GestionNoPaquet = { files: { label: string; url: string }[] };

// ——— M6 : suivi-évaluation (§14) ———

export type GestionSeEntonnoir = { label: string; v: number };
export type GestionSeExecution = { engage: number; decaisse: number; justifie: number };
export type GestionSeDelais = { completude: number | null; eligibilite: number | null; evaluation: number | null; paiement: number | null };
export type GestionSeAlerte = { icon: string; titre: string; detail: string; lien: string };
export type GestionSeTableauDeBord = {
  entonnoir: GestionSeEntonnoir[];
  execution: GestionSeExecution;
  delais: GestionSeDelais;
  alertes: GestionSeAlerte[];
};

export type GestionSeIndicateur = {
  code: string;
  famille: string;
  familleLibelle: string;
  libelle: string;
  mode: 'calcule' | 'saisi';
  unite: string | null;
  cible: string;
  valeur: string;
  ecart: 'ok' | 'ko' | null;
};

export type GestionSeDepouillementValeurs = { empT: number | string; empF: number | string; empJ: number | string; empR: number | string; benef: number | string; inv: number | string; incidents: number | string; note: string };
export type GestionSeDepouillement = {
  documentId: string;
  titre: string;
  operateur: string;
  convention: string | null;
  dateTransmission: string | null;
  fichierUrl: string | null;
  statut: 'a_depouiller' | 'propose' | 'valide';
  saisiPar: string | null;
  valeurs: GestionSeDepouillementValeurs;
};

export type GestionSeRapport = { documentId: string; periode: string; pdf: { url?: string; name?: string } | null; generePar: string | null; genereLe: string | null };
export type GestionSeCohorte = { documentId: string; label: string };

// ——— M7 : administration (§3.9/§9.5/§14.10) ———
export type GestionAdminCompte = {
  id: number;
  nom: string;
  email: string;
  role: 'instructeur' | 'ugp' | 'comite' | null;
  adminComptes: boolean;
  statut: 'actif' | 'desactive' | 'invitation';
};
export type GestionAdminActeur = { id: number; nom: string };
export type GestionAdminJournalEntry = {
  date: string;
  acteur: string;
  role: string;
  cat: 'instr' | 'eval' | 'dec' | 'subv' | 'assist' | 'adm';
  typeLabel: string;
  acte: string;
  reference: string;
};
export type GestionAdminJournal = {
  data: GestionAdminJournalEntry[];
  meta: { total: number; page: number; pageSize: number };
  acteurs: GestionAdminActeur[];
};
export type GestionAdminJournalFilters = { periode?: string; type?: string; acteur?: string; dossier?: string; page?: number; pageSize?: number };
