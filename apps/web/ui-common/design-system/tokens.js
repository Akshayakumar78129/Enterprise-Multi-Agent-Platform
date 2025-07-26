/**
 * Enterprise IQ Design System Tokens
 * This file defines the core design tokens used across all Enterprise IQ applications
 */

// Color System
export const colors = {
  // Primary colors
  midnightNavy: '#0a1224',    // Primary Background
  electricCyan: '#00e0ff',    // Interactive Focus & Agent Highlights
  signalMagenta: '#e930ff',   // Alert & Anomaly Accents
  graphite: '#232a36',        // Card Bodies & Chart Canvas
  graphiteLight: '#3a4459',   // Secondary Card Bodies & Chart Canvas
  cloudWhite: '#f7f9fb',      // Text & High-Contrast Surfaces
  
  // Secondary colors
  lighterCyan: '#5fd4d6',     // Secondary highlight, used in charts
  teal: '#43cad0',            // Tertiary highlight, used in charts
  mutedPurple: '#aa45dd',     // Secondary alert, used for medium severity
  amber: '#ffc145',           // Warning color, used for medium alerts
  mutedMagenta: '#d45d79',    // Used for poor/medium-bad indicators
  blueGray: '#3e7b97',        // Used for neutral indicators
  
  // Functional colors
  success: '#39ff14',         // Success indicators
  error: '#ff1f4f',           // Error indicators
  
  // Opacity variants
  overlay10: 'rgba(10, 18, 36, 0.1)',
  overlay20: 'rgba(10, 18, 36, 0.2)',
  overlay50: 'rgba(10, 18, 36, 0.5)',
  
  // Chart gradients
  chartGradients: {
    cyan: ['#00e0ff', '#5fd4d6'],
    magenta: ['#e930ff', '#aa45dd'],
    blue: ['#3e7b97', '#5fd4d6'],
    amber: ['#ffc145', '#d45d79'],
  }
};

// Typography
export const typography = {
  fontFamily: {
    primary: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem',    // 32px
    '5xl': '2.5rem',  // 40px
    '6xl': '3rem',    // 48px
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing system (based on 8pt grid)
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: `0 2px 4px 0 ${colors.overlay10}`,
  md: `0 4px 8px 0 ${colors.overlay20}`,
  lg: `0 8px 16px 0 ${colors.overlay20}`,
  xl: `0 12px 24px 0 ${colors.overlay20}`,
  inner: `inset 0 2px 4px 0 ${colors.overlay10}`,
  glow: {
    cyan: `0 0 15px 3px ${colors.electricCyan}`,
    magenta: `0 0 15px 3px ${colors.signalMagenta}`,
    white: `0 0 15px 3px ${colors.cloudWhite}`,
  },
};

// Z-index
export const zIndex = {
  0: 0,
  10: 10,      // Base elements
  20: 20,      // Raised elements
  30: 30,      // Overlays
  40: 40,      // Modals
  50: 50,      // Tooltips
  60: 60,      // Robot character and lasers
  max: 9999,   // Highest (alerts, popups)
};

// Transitions
export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
  slow: 'all 0.5s ease',
  robot: {
    movement: 'left 1.5s cubic-bezier(0.4, 0, 0.2, 1), bottom 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
    laser: 'height 0.05s linear, background 0.2s ease, box-shadow 0.2s ease',
  }
};

// Chart colors for Plotly
export const chartColors = {
  background: colors.graphite,
  text: colors.cloudWhite,
  grid: 'rgba(0, 229, 255, 0.15)',
  primary: colors.electricCyan,
  secondary: colors.signalMagenta,
  tertiary: colors.lighterCyan,
  quaternary: colors.mutedPurple,
  anomalyPositive: colors.success,
  anomalyNegative: colors.error,
  
  // Preset colorscales for heatmaps
  heatmapColdToHot: [
    [0, colors.midnightNavy],
    [0.5, colors.blueGray],
    [0.75, colors.electricCyan],
    [1, colors.signalMagenta]
  ],
  heatmapDefaultToAccent: [
    [0, colors.midnightNavy],
    [1, colors.electricCyan]
  ],
};

// Export combined tokens
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  chartColors,
};

export default tokens; 