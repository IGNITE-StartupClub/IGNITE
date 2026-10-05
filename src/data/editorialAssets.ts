export const materialCovers: Record<string, string> = {
  AppLaunchChecklist: '/img/heritage/rocket-sculpture.png',
  ApplicationHack: '/img/heritage/salt-sculpture.png',
  EarlyTractionScoreboard: '/img/heritage/cog-sculpture.png',
  POVClarityFramework: '/img/heritage/cog-sculpture.png',
  'Sequoia Framework': '/img/heritage/cog-sculpture.png',
}

export const getMaterialCover = (id: string, fallback?: string) =>
  materialCovers[id] ?? fallback ?? '/img/heritage/salt-sculpture.png'
