/**
 * src/config/theme.config.js
 * Design token defaults and breakpoint documentation.
 */
export const themeConfig = {
  // Color tokens (dark theme defaults)
  colors: {
    bg: '#141414',
    surface: '#1f1f1f',
    surfaceElevated: '#2c2c2e',
    card: '#2c2c2e',
    cardHover: '#3a3a3c',
    accent: '#e50914',
    accentHover: '#ff1f2d',
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    border: 'rgba(255,255,255,0.1)',
    success: '#46d369',
    warning: '#f5c518',
    error: '#ff4b4b',
  },
  // Typography tokens
  typography: {
    fontHeading: "'Outfit', 'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
    },
  },
  // Layout spacing
  spacing: {
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.5rem',
    '6': '2rem',
    '8': '3rem',
    '10': '4rem',
  },
  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  // Motion durations
  motion: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  // Shadow tokens
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.2)',
    xl: '0 20px 30px rgba(0,0,0,0.3)',
  },
  // Navbar dimensions
  navbar: {
    height: '80px',
    heightSmall: '60px',
  },
  // Z-index layers
  zIndex: {
    navbar: 1000,
    overlay: 1100,
    modal: 1200,
    tooltip: 1300,
  },
  // Breakpoint values (used in JS and documented for CSS)
  breakpoints: {
    mobileS: 360,
    mobileL: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1280,
    wide: 1536,
  },
};
