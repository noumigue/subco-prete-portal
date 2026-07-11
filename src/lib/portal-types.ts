export type PortalRole = 'candidat' | 'beneficiaire' | 'instructeur' | 'ugp' | 'comite' | 'banque' | 'authenticated';

export type PortalSession = {
  userId: number;
  orgName: string;
  email: string;
  emailVerified: boolean;
  phone?: string | null;
  role: PortalRole;
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

export type PortalFaqEntree = {
  id: number;
  documentId: string;
  question?: string;
  reponse?: PortalBlock[];
  ordre?: number;
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
  statutClos: string | null;
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
};

export type GestionAppel = {
  documentId: string;
  nom?: string;
  codeCohorte?: string;
  statut?: 'ouvert' | 'ferme' | 'a_venir';
  ouvertLe?: string | null;
  clotureLe?: string | null;
};
