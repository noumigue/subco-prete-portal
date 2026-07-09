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

export type PortalResourceDocument = {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  file?: { url?: string } | null;
};
