// Strapi API Client for IGNITE Website
const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN || '';

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiAttributes {
  [key: string]: any;
}

interface StrapiData {
  id: number;
  documentId?: string;
  attributes?: StrapiAttributes;
  [key: string]: any;
}

// Helper to transform Strapi response format
// Supports both Strapi v4 (with attributes) and v5 (flat structure)
function transformStrapiData<T>(item: StrapiData): T {
  const { id, documentId, attributes, ...rest } = item;

  // If attributes exist (Strapi v4), use them; otherwise use flat structure (Strapi v5)
  const dataSource = attributes || rest;

  // Handle nested relations and media
  const transformed: any = { id };

  // Add documentId if present (Strapi v5)
  if (documentId) {
    transformed.documentId = documentId;
  }

  for (const [key, value] of Object.entries(dataSource)) {
    if (value && typeof value === 'object' && 'data' in value) {
      // It's a relation or media
      if (Array.isArray(value.data)) {
        transformed[key] = value.data.map((d: StrapiData) => transformStrapiData(d));
      } else if (value.data) {
        transformed[key] = transformStrapiData(value.data);
      } else {
        transformed[key] = null;
      }
    } else {
      transformed[key] = value;
    }
  }

  return transformed as T;
}

// Generic fetch function
async function fetchFromStrapi<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const url = new URL(`/api/${endpoint}`, STRAPI_URL);

  // Add default population for relations
  if (!params.populate) {
    params.populate = '*';
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (STRAPI_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    const json: StrapiResponse<StrapiData[]> = await response.json();
    return json.data.map((item) => transformStrapiData<T>(item));
  } catch (error) {
    console.error(`Error fetching from Strapi (${endpoint}):`, error);
    return [];
  }
}

async function fetchSingleFromStrapi<T>(
  endpoint: string,
  id: number | string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const url = new URL(`/api/${endpoint}/${id}`, STRAPI_URL);

  if (!params.populate) {
    params.populate = '*';
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (STRAPI_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    const json: StrapiResponse<StrapiData> = await response.json();
    return transformStrapiData<T>(json.data);
  } catch (error) {
    console.error(`Error fetching single from Strapi (${endpoint}/${id}):`, error);
    return null;
  }
}

// Type definitions for content types
export interface TeamMember {
  id: number;
  name: string;
  position: string | string[];
  photo: { url: string } | null;
  description: string;
  long_description?: string;
  linkedin?: string;
  email?: string;
  team?: Team;
  order: number;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  members?: TeamMember[];
  order: number;
}

export interface AdvisoryBoardMember {
  id: number;
  name: string;
  title: string;
  department?: string;
  boardRole: string;
  bio?: string;
  linkedin?: string;
  image: { url: string } | null;
  initials?: string;
  order: number;
}

export interface JobPosition {
  id: number;
  team: string;
  title: string;
  description: string;
  category: 'intern' | 'extern';
  image: { url: string } | null;
  isActive: boolean;
  order: number;
}

export interface Partner {
  id: number;
  name: string;
  logo: { url: string };
  url?: string;
  description?: string;
  order: number;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string;
  date: string;
  time: string;
  location?: string;
  image: { url: string } | null;
  author?: string;
  author_title?: string;
  avatar: { url: string } | null;
  register_url?: string;
  isFeatured: boolean;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string;
  image: { url: string } | null;
  author?: string;
  date: string;
  tags?: string[];
  isFeatured: boolean;
}

// API Functions
export async function getTeams(): Promise<Team[]> {
  return fetchFromStrapi<Team>('teams', {
    'populate[members][populate]': '*',
    'sort': 'order:asc'
  });
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return fetchFromStrapi<TeamMember>('team-members', {
    'populate': '*',
    'sort': 'order:asc'
  });
}

export async function getAdvisoryBoardMembers(): Promise<AdvisoryBoardMember[]> {
  return fetchFromStrapi<AdvisoryBoardMember>('advisory-board-members', {
    'populate': '*',
    'sort': 'order:asc'
  });
}

export async function getJobPositions(activeOnly = true): Promise<JobPosition[]> {
  const params: Record<string, string> = {
    'populate': '*',
    'sort': 'order:asc'
  };

  if (activeOnly) {
    params['filters[isActive][$eq]'] = 'true';
  }

  return fetchFromStrapi<JobPosition>('job-positions', params);
}

export async function getPartners(): Promise<Partner[]> {
  return fetchFromStrapi<Partner>('partners', {
    'populate': '*',
    'sort': 'order:asc'
  });
}

export async function getEvents(limit?: number): Promise<Event[]> {
  const params: Record<string, string> = {
    'populate': '*',
    'sort': 'date:asc',
    'filters[date][$gte]': new Date().toISOString().split('T')[0]
  };

  if (limit) {
    params['pagination[pageSize]'] = limit.toString();
  }

  return fetchFromStrapi<Event>('events', params);
}

export async function getEvent(slug: string): Promise<Event | null> {
  const events = await fetchFromStrapi<Event>('events', {
    'populate': '*',
    'filters[slug][$eq]': slug
  });
  return events[0] || null;
}

export async function getNewsArticles(limit?: number): Promise<NewsArticle[]> {
  const params: Record<string, string> = {
    'populate': '*',
    'sort': 'date:desc'
  };

  if (limit) {
    params['pagination[pageSize]'] = limit.toString();
  }

  return fetchFromStrapi<NewsArticle>('news-articles', params);
}

export async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  const articles = await fetchFromStrapi<NewsArticle>('news-articles', {
    'populate': '*',
    'filters[slug][$eq]': slug
  });
  return articles[0] || null;
}

// Helper to get full media URL
export function getStrapiMediaUrl(media: { url: string } | null): string {
  if (!media) return '';
  if (media.url.startsWith('http')) return media.url;
  return `${STRAPI_URL}${media.url}`;
}

export { STRAPI_URL };
