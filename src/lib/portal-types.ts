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
  motifDecisionCourt?: string | null;
  appel?: PortalAppel | null;
  organisation?: PortalOrganisation | null;
  statut?: PortalStatus | null;
  complements?: PortalComplement[];
  notifications?: PortalNotification[];
  pdfPermanent?: { url?: string } | null;
  notificationDecision?: { url?: string } | null;
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

export type PortalResourceDocument = {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  file?: { url?: string } | null;
};
