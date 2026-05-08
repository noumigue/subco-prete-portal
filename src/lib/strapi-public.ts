import type { RichTextValue } from './richtext';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${STRAPI_URL}${path}`, { next: { revalidate: 30 } });
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
  callStatus?: 'draft' | 'open' | 'closed';
  openingDate?: string;
  deadlineDate?: string;
};

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

export async function getHomepage() {
  const out = await getJson<StrapiOne<Homepage>>('/api/homepage?populate=heroImage');
  return out?.data || null;
}

export async function getValueChains() {
  const out = await getJson<StrapiList<ValueChainItem>>('/api/value-chains?sort=priorityOrder:asc&populate=heroImage');
  return out?.data || [];
}

export async function getValueChainBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<ValueChainItem>>(`/api/value-chains?filters[slug][$eq]=${q}&pagination[limit]=1&populate=heroImage`);
  return out?.data?.[0] || null;
}

export async function getCalls() {
  const out = await getJson<StrapiList<CallItem>>('/api/call-for-proposals?sort=deadlineDate:asc');
  return out?.data || [];
}

export async function getCallBySlug(slug: string) {
  const q = encodeURIComponent(slug);
  const out = await getJson<StrapiList<CallItem>>(`/api/call-for-proposals?filters[slug][$eq]=${q}&pagination[limit]=1`);
  return out?.data?.[0] || null;
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
