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

export type Homepage = {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type CallItem = {
  id: number;
  title?: string;
  slug?: string;
  summary?: string;
  status?: 'draft' | 'open' | 'closed';
  openingDate?: string;
  deadlineDate?: string;
};

export type EventItem = {
  id: number;
  title?: string;
  slug?: string;
  location?: string;
  eventDate?: string;
};

export type NewsItem = {
  id: number;
  title?: string;
  slug?: string;
  excerpt?: string;
  publishedAtCustom?: string;
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
};

export async function getHomepage() {
  const out = await getJson<StrapiOne<Homepage>>('/api/homepage');
  return out?.data || null;
}

export async function getCalls() {
  const out = await getJson<StrapiList<CallItem>>('/api/call-for-proposals?sort=deadlineDate:asc');
  return out?.data || [];
}

export async function getEvents() {
  const out = await getJson<StrapiList<EventItem>>('/api/events?sort=eventDate:asc');
  return out?.data || [];
}

export async function getNews() {
  const out = await getJson<StrapiList<NewsItem>>('/api/news-items?sort=publishedAtCustom:desc');
  return out?.data || [];
}

export async function getSuccessStories() {
  const out = await getJson<StrapiList<SuccessStory>>('/api/success-stories');
  return out?.data || [];
}

export async function getFaqs() {
  const out = await getJson<StrapiList<FaqItem>>('/api/faqs?sort=sortOrder:asc');
  return out?.data || [];
}
