// Server-side loaders for Astro SSG
// These run at build time and pre-fetch all CMS data

import {
  getTeams,
  getTeamMembers,
  getAdvisoryBoardMembers,
  getTeamPositions,
  getPartners,
  getEvents,
  getNewsArticles,
  getStrapiMediaUrl,
  type Team,
  type TeamMember,
  type AdvisoryBoardMember,
  type TeamPosition,
  type Partner,
  type Event,
  type NewsArticle,
} from './client';

// Transform team data to match the old format
export async function loadTeamsData() {
  try {
    const teams = await getTeams();

    // Transform to old format for backwards compatibility
    return teams.map((team) => ({
      name: team.name,
      description: team.description || '',
      members: (team.members || []).map((member) => ({
        name: member.name,
        position: member.position,
        photo: member.photo ? getStrapiMediaUrl(member.photo) : '/team/',
        description: member.description,
        long_description: member.long_description || member.description,
        linkedin: member.linkedin || '',
        email: member.email || '',
      })),
    }));
  } catch (error) {
    console.error('Error loading teams from Strapi:', error);
    // Return empty array - fallback to local data
    return null;
  }
}

// Load advisory board members
export async function loadAdvisoryBoardData() {
  try {
    const members = await getAdvisoryBoardMembers();

    return members.map((member) => ({
      id: member.id,
      name: member.name,
      title: member.title,
      department: member.department || '',
      boardRole: member.boardRole,
      bio: member.bio || '',
      linkedin: member.linkedin || '',
      image: member.image ? getStrapiMediaUrl(member.image) : '',
      initials: member.initials || member.name.split(' ').map((n) => n[0]).join('').slice(0, 2),
    }));
  } catch (error) {
    console.error('Error loading advisory board from Strapi:', error);
    return null;
  }
}

// Load team positions (for /mitmachen page)
export async function loadTeamPositionsData() {
  try {
    const positions = await getTeamPositions(true);

    return positions.map((pos) => ({
      id: pos.team.toLowerCase().replace(/\s+/g, '-'),
      image: pos.image ? getStrapiMediaUrl(pos.image) : '',
      category: pos.category,
      team: pos.team,
      title: pos.title,
      description: pos.description,
    }));
  } catch (error) {
    console.error('Error loading team positions from Strapi:', error);
    return null;
  }
}

// Legacy function for backwards compatibility
export const loadJobPositionsData = loadTeamPositionsData;

// Load partners
export async function loadPartnersData() {
  try {
    const partners = await getPartners();

    return partners.map((partner) => ({
      name: partner.name,
      logo: getStrapiMediaUrl(partner.logo),
      url: partner.url || '#',
    }));
  } catch (error) {
    console.error('Error loading partners from Strapi:', error);
    return null;
  }
}

// Load events for Astro content collection compatibility
export async function loadEventsData() {
  try {
    const events = await getEvents();

    return events.map((event) => ({
      slug: event.slug,
      data: {
        title: event.title,
        description: event.description,
        content: event.content || '',
        date: event.date,
        time: event.time,
        location: event.location || '',
        image: event.image ? getStrapiMediaUrl(event.image) : '/default-image.jpg',
        author: event.author || 'IGNITE Team',
        author_title: event.author_title || '',
        avatar: event.avatar ? getStrapiMediaUrl(event.avatar) : '/default-avatar.jpg',
        register_url: event.register_url || '#',
      },
    }));
  } catch (error) {
    console.error('Error loading events from Strapi:', error);
    return null;
  }
}

// Load news articles for Astro content collection compatibility
export async function loadNewsArticlesData() {
  try {
    const articles = await getNewsArticles();

    return articles.map((article) => ({
      slug: article.slug,
      data: {
        title: article.title,
        description: article.description,
        content: article.content || '',
        image: article.image ? getStrapiMediaUrl(article.image) : '/default-image.jpg',
        author: article.author || 'IGNITE Team',
        date: article.date,
        tags: article.tags || [],
      },
    }));
  } catch (error) {
    console.error('Error loading news articles from Strapi:', error);
    return null;
  }
}

export type {
  Team,
  TeamMember,
  AdvisoryBoardMember,
  TeamPosition,
  Partner,
  Event,
  NewsArticle,
};
