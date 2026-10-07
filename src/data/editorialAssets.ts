export const materialCovers: Record<string, string> = {
  applaunchchecklist: '/img/heritage/rocket-sculpture.png',
  applicationhack: '/img/heritage/salt-sculpture.png',
  earlytractionscoreboard: '/img/heritage/cog-sculpture.png',
  povclarityframework: '/img/heritage/cog-sculpture.png',
  'sequoia-framework': '/img/heritage/cog-sculpture.png',
}

export const getMaterialCover = (id: string, fallback?: string) =>
  materialCovers[id.toLowerCase().replace(/\s+/g, '-')] ?? fallback ?? '/img/heritage/salt-sculpture.png'
