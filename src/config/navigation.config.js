/**
 * navigation.config.js
 * Configuration-driven navigation items for the sticky header.
 * Each item maps to a route defined in routes.config.js.
 */
export const navigationItems = [
  { label: 'Home', route: '/home', icon: 'Home' },
  { label: 'Discover', route: '/discover', icon: 'Search' },
  { label: 'Movies', route: '/movies', icon: 'Film' },
  { label: 'TV Shows', route: '/tv', icon: 'Tv' },
  { label: 'Anime', route: '/anime', icon: 'Play' },
  { label: 'Collections', route: '/collections', icon: 'Layers' },
  { label: 'AI', route: '/ai', icon: 'Cpu' },
  // Separator visual handled in component
  { label: 'Search', route: '/search', icon: 'Search' },
  { label: 'My List', route: '/watchlist', icon: 'Bookmark' },
  { label: 'Notifications', route: '/notifications', icon: 'Bell' },
  { label: 'Guest', route: '/profile', icon: 'User' },
];
