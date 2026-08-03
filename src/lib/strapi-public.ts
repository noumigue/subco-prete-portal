import type { RichTextValue } from './richtext';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${STRAPI_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type StrapiList<T> = { data: T[] };
type StrapiOne<T> = { data: T };

type StrapiMedia = {
  url?: string;
  data?: {
    url?: string;
    attributes?: {
      url?: string;
    };
  };
};

export type Homepage = {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroImage?: StrapiMedia;
};

export type ValueChainItem = {
  id: number;
  name?: string;
  slug?: string;
  photoHint?: string;
  shortIntro?: string;
  fullContent?: RichTextValue;
  priorityOrder?: number;
  isFeaturedHome?: boolean;
  heroImage?: StrapiMedia;
};

export type InfrastructureTypeItem = {
  id: number;
  title?: string;
  slug?: string;
  order?: number;
  nature?: 'physique' | 'immaterielle' | 'mixte';
  icon?: string;
  cardText?: string;
  lead?: string;
  body?: RichTextValue;
  highlight?: boolean;
};

export type InfrastructureBand = {
  title?: string;
  intro?: string;
};

function orderValueChains(items: ValueChainItem[]) {
  return [...items].sort((a, b) => {
    const aIsTransversal = a.slug === 'projet-transversal';
    const bIsTransversal = b.slug === 'projet-transversal';
    if (aIsTransversal && !bIsTransversal) return 1;
    if (!aIsTransversal && bIsTransversal) return -1;
    return (a.priorityOrder || 0) - (b.priorityOrder || 0);
  });
}

export function mediaUrl(media: StrapiMedia | null | undefined): string | null {
  const url = media?.url || media?.data?.url || media?.data?.attributes?.url;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${STRAPI_URL}${url}`;
}

export type CallItem = {
  id: number;
  title?: string;
  slug?: string;
  summary?: string;
  content?: RichTextValue;
  callStatus?: string;
  openingDate?: string;
  deadlineDate?: string;
};

function isPublicCall(item: CallItem) {
  const status = (item.callStatus || '').toLowerCase();
  return status !== 'draft' && status !== 'hidden' && status !== 'private';
}

export type EventItem = {
  id: number;
  title?: string;
  slug?: string;
  location?: string;
  eventDate?: string;
  description?: RichTextValue;
};

export type NewsItem = {
  id: number;
  title?: string;
  slug?: string;
  category?: 'actualite' | 'communique' | 'annonce_resultat';
  excerpt?: string;
  publishedAtCustom?: string;
  content?: RichTextValue;
};

export type SuccessStory = {
  id: number;
  title?: string;
  slug?: string;
  operatorName?: string;
  summary?: string;
};

export type FaqItem = {
  id: number;
  question?: string;
  answer?: RichTextValue;
};

export type FaqTheme = 'eligibilite' | 'dossier' | 'financement' | 'selection';

export type FaqTopicItem = {
  id: number;
  question?: string;
  reponse?: RichTextValue;
  theme?: FaqTheme;
  ordre?: number;
  publie?: boolean;
};

export type PartnerItem = {
  id: number;
  name?: string;
  logo?: StrapiMedia;
  websiteUrl?: string;
  sortOrder?: number;
  isVisible?: boolean;
};

export type PageSection = {
  title?: string;
  text?: string;
};

export type AboutListItem = {
  label?: string;
  text?: string;
};

export type AboutPage = {
  kicker?: string;
  title?: string;
  intro?: string;
  sections?: PageSection[];
  briefItems?: AboutListItem[];
  platformItems?: AboutListItem[];
  institutionalItems?: AboutListItem[];
};

export type CandidatureGuide = {
  kicker?: string;
  title?: string;
  intro?: string;
  sections?: PageSection[];
  preStartItems?: AboutListItem[];
  formStepItems?: AboutListItem[];
  eligibilityItems?: AboutListItem[];
  projectProofItems?: AboutListItem[];
  documentItems?: AboutListItem[];
  riskItems?: AboutListItem[];
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
};

export type FooterLink = {
  id: number;
  label?: string;
  url?: string;
  group?:
    | 'assistance'
    | 'institutional'
    | 'resources'
    | 'programme'
    | 'candidater'
    | 'aide'
    | 'legal';
  sortOrder?: number;
  isVisible?: boolean;
};

export type SiteLanguage = 'fr' | 'rn';

export type NavigationLinkItem = {
  labelFr?: string;
  labelRn?: string;
  url?: string;
  sortOrder?: number;
  isVisible?: boolean;
};

export type SiteNavigation = {
  brandLabel?: string;
  logo?: StrapiMedia;
  logoIcon?: StrapiMedia;
  supportLabelFr?: string;
  supportLabelRn?: string;
  supportUrl?: string;
  primaryItems?: NavigationLinkItem[];
  newsLabelFr?: string;
  newsLabelRn?: string;
  newsItems?: NavigationLinkItem[];
  ctaLabelFr?: string;
  ctaLabelRn?: string;
  ctaUrl?: string;
};

export type ResourceDocument = {
  id: number;
  documentId?: string;
  title?: string;
  category?: 'appel' | 'tdr' | 'formulaire' | 'modele' | 'guide' | 'grille' | 'manuel' | 'note' | 'rapport' | 'autre';
  description?: string;
  file?: StrapiMedia;
};

type ProgramStepRaw = {
  id: number;
  titre?: string;
  description?: string;
  cohorte?: string;
  statut?: 'termine' | 'en-cours' | 'a-venir';
  date_affichee?: string;
  lien_url?: string;
  lien_label?: string;
  ordre?: number;
};

export type ProgramStep = {
  id: number;
  title?: string;
  description?: string;
  cohort?: string;
  status?: 'termine' | 'en-cours' | 'a-venir';
  displayDate?: string;
  linkUrl?: string;
  linkLabel?: string;
  order?: number;
};

export async function getHomepage() {
  const out = await getJson<StrapiOne<Homepage>>('/api/homepage?populate=heroImage');
  return out?.data || null;
}

export async function getAboutPage() {
  const out = await getJson<StrapiOne<AboutPage>>('/api/about-page');
  return out?.data || null;
}

export async function getCandidatureGuide() {
  const out = await getJson<StrapiOne<CandidatureGuide>>('/api/candidature-guide');
  return out?.data || null;
}

export async function getValueChains() {
  const out = await getJson<StrapiList<ValueChainItem>>('/api/value-chains?sort=priorityOrder:asc&populate=heroImage');
  return orderValueChains(out?.data || []);
}

export async function getInfrastructureTypes() {
  const out = await getJson<StrapiList<InfrastructureTypeItem>>('/api/infrastructure-types?sort=order:asc&pagination[pageSize]=100');
  return (out?.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getInfrastructureBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<InfrastructureTypeItem>>(`/api/infrastructure-types?filters[slug][$eq]=${q}&pagination[limit]=1`);
  return out?.data?.[0] || null;
}

export async function getInfrastructureBand() {
  const out = await getJson<StrapiOne<InfrastructureBand>>('/api/infrastructure-band');
  return out?.data || null;
}

export async function getValueChainBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<ValueChainItem>>(`/api/value-chains?filters[slug][$eq]=${q}&pagination[limit]=1&populate=heroImage`);
  return out?.data?.[0] || null;
}

export async function getCalls() {
  const out = await getJson<StrapiList<CallItem>>('/api/call-for-proposals?sort=deadlineDate:asc');
  return out?.data?.filter(isPublicCall) || [];
}

function buildCallMatchingKey(openingDate?: string, deadlineDate?: string) {
  return `${openingDate || ''}|${deadlineDate || ''}`;
}

// Bande « Appels à propositions » de l'accueil : source de vérité = le content-type
// OPÉRATIONNEL `appel` (celui des candidatures / back-office), pour que la home ne dérive
// jamais des dates réelles. On mappe `appel` vers la forme CallItem attendue par la bande.
type AppelRaw = { id: number; nom?: string; codeCohorte?: string; statut?: string; ouvertLe?: string; clotureLe?: string };
const APPEL_STATUT_TO_CALL: Record<string, string> = { ouvert: 'open', a_venir: 'upcoming', ferme: 'closed' };
export async function getHomeAppels(): Promise<CallItem[]> {
  const [out, editorialCalls] = await Promise.all([
    getJson<StrapiList<AppelRaw>>('/api/appels?sort=ouvertLe:asc&pagination[pageSize]=100'),
    getCalls(),
  ]);
  const editorialByDates = new Map(editorialCalls.map((item) => [buildCallMatchingKey(item.openingDate, item.deadlineDate), item]));
  return (out?.data || []).map((a) => {
    const editorial = editorialByDates.get(buildCallMatchingKey(a.ouvertLe, a.clotureLe));
    return {
    id: a.id,
    title: a.nom,
    slug: editorial?.slug,
    summary: editorial?.summary,
    content: editorial?.content,
    callStatus: APPEL_STATUT_TO_CALL[String(a.statut || '').toLowerCase()] || a.statut,
    openingDate: a.ouvertLe,
    deadlineDate: a.clotureLe,
  };
  });
}

export async function getCallBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<CallItem>>(`/api/call-for-proposals?filters[slug][$eq]=${q}&pagination[limit]=1`);
  const item = out?.data?.[0] || null;
  return item && isPublicCall(item) ? item : null;
}

export async function getResourceDocuments() {
  const out = await getJson<StrapiList<ResourceDocument>>('/api/resource-documents?sort=title:asc&populate=file');
  return out?.data || [];
}

// Référentiel des pièces du dossier (Annexe 9), en lecture publique — pour la checklist
// affichée sur la page /candidature (mêmes données que la liste de /faq-documents).
export type TypePiece = { id: number; documentId?: string; libelle?: string; groupe?: string; exigence?: string; ordre?: number };
export async function getTypePieces() {
  const out = await getJson<StrapiList<TypePiece>>('/api/type-pieces?sort=ordre:asc&pagination[pageSize]=100');
  return out?.data || [];
}

export async function getProgramSteps() {
  const out = await getJson<StrapiList<ProgramStepRaw>>('/api/etape-programmes?sort=cohorte:asc&sort=ordre:asc&pagination[pageSize]=100');
  return (out?.data || []).map((item) => ({
    id: item.id,
    title: item.titre,
    description: item.description,
    cohort: item.cohorte,
    status: item.statut,
    displayDate: item.date_affichee,
    linkUrl: item.lien_url,
    linkLabel: item.lien_label,
    order: item.ordre,
  }));
}

export async function getEvents() {
  const out = await getJson<StrapiList<EventItem>>('/api/events?sort=eventDate:asc');
  return out?.data || [];
}

export async function getEventBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<EventItem>>(`/api/events?filters[slug][$eq]=${q}&pagination[limit]=1`);
  return out?.data?.[0] || null;
}

export async function getNews() {
  const out = await getJson<StrapiList<NewsItem>>('/api/news-items?sort=publishedAtCustom:desc');
  return out?.data || [];
}

export async function getNewsByCategory(category: NonNullable<NewsItem['category']>) {
  const q = encodeURIComponent(category);
  const out = await getJson<StrapiList<NewsItem>>(`/api/news-items?filters[category][$eq]=${q}&sort=publishedAtCustom:desc`);
  return out?.data || [];
}

export async function getNewsBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<NewsItem>>(`/api/news-items?filters[slug][$eq]=${q}&pagination[limit]=1`);
  return out?.data?.[0] || null;
}

export async function getSuccessStories() {
  const out = await getJson<StrapiList<SuccessStory>>('/api/success-stories');
  return out?.data || [];
}

export async function getFaqs() {
  const out = await getJson<StrapiList<FaqItem>>('/api/faqs?sort=sortOrder:asc');
  return out?.data || [];
}

export async function getFaqItems() {
  const out = await getJson<StrapiList<FaqTopicItem>>('/api/faq-items?filters[publie][$eq]=true&sort[0]=theme:asc&sort[1]=ordre:asc&pagination[pageSize]=100');
  return out?.data?.filter((item) => item.publie !== false) || [];
}

export async function getPartners() {
  const out = await getJson<StrapiList<PartnerItem>>('/api/partners?sort=sortOrder:asc&populate=logo');
  return out?.data?.filter((item) => item.isVisible !== false) || [];
}

export async function getFooterLinks() {
  const out = await getJson<StrapiList<FooterLink>>('/api/footer-links?sort[0]=group:asc&sort[1]=sortOrder:asc');
  return out?.data?.filter((item) => item.isVisible !== false) || [];
}

export async function getSiteNavigation() {
  // NB : les médias se peuplent avec `=true` (le `=*` ne renvoie rien pour un média en Strapi 5,
  // contrairement aux composants primaryItems/newsItems).
  const out = await getJson<StrapiOne<SiteNavigation>>('/api/site-navigation?populate[primaryItems]=*&populate[newsItems]=*&populate[logo]=true&populate[logoIcon]=true');
  return out?.data || null;
}

export type BrandAssets = { label: string; logoUrl: string | null; logoIconUrl: string | null };

// Assets de marque par defaut (livres dans /public) : le logo s'affiche partout sans
// aucun upload. Les champs CMS `site-navigation.logo`/`logoIcon`, une fois renseignes,
// prennent le dessus (editable sans redeploiement).
export const DEFAULT_LOGO_URL = '/subco-prete-logo.png';
export const DEFAULT_LOGO_ICON_URL = '/subco-prete-logo-icon.png';

// Assets de marque (logo complet + icône) resolus depuis `site-navigation`, reutilisables
// dans tous les shells (public, operateur, gestion).
export async function getBrandAssets(): Promise<BrandAssets> {
  const nav = await getSiteNavigation();
  return {
    label: nav?.brandLabel || 'SUBCO PRETE',
    logoUrl: mediaUrl(nav?.logo) || DEFAULT_LOGO_URL,
    logoIconUrl: mediaUrl(nav?.logoIcon) || DEFAULT_LOGO_ICON_URL,
  };
}
