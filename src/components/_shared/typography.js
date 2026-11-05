// src/components/_shared/typography.js
/**
 * Typography token definitions – expose font families, sizes, line heights.
 */
export const typography = {
  fontFamily: 'var(--font-family, "Inter", sans-serif)',
  size: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    md: 'var(--text-md)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)'
  },
  lineHeight: {
    xs: '1.2',
    sm: '1.3',
    md: '1.4',
    lg: '1.5',
    xl: '1.6'
  }
};
