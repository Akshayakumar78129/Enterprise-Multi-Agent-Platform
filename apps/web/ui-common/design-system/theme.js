import React, { createContext, useContext, useState, useEffect } from 'react';
import tokens from './tokens';

/**
 * Theme Context - Provides access to the Enterprise IQ design system theme
 */
const ThemeContext = createContext(tokens);

/**
 * Theme Provider component that wraps the application and provides theme context
 */
export const ThemeProvider = ({ children, initialTheme = 'dark' }) => {
  const [theme, setTheme] = useState(initialTheme);
  
  // The Enterprise IQ system primarily uses a dark theme, but we support light theme for specific contexts
  const themeTokens = {
    ...tokens,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Add theme provider value with tokens and utility functions
  const themeContext = {
    ...themeTokens,
    toggleTheme,
    setTheme,
    generateVariants,
  };
  
  // Apply theme class to document for global CSS variables
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-dark', 'theme-light');
      document.documentElement.classList.add(`theme-${theme}`);
      
      // Set CSS variables for colors
      const root = document.documentElement;
      
      // Primary colors
      root.style.setProperty('--primary-bg', tokens.colors.midnightNavy);
      root.style.setProperty('--interactive-focus', tokens.colors.electricCyan);
      root.style.setProperty('--alert-accent', tokens.colors.signalMagenta);
      root.style.setProperty('--card-bg', tokens.colors.graphite);
      root.style.setProperty('--card-bg-light', tokens.colors.graphiteLight);
      root.style.setProperty('--text-color', tokens.colors.cloudWhite);
      
      // Adjust variables if light theme is active
      if (theme === 'light') {
        root.style.setProperty('--primary-bg', '#f7f9fb');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--card-bg-light', '#f0f2f5');
        root.style.setProperty('--text-color', '#0a1224');
      }
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook for accessing the theme from any component
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Utility to generate chart theme based on current design tokens
 */
export const generateChartTheme = (overrides = {}) => {
  const { chartColors } = tokens;
  
  return {
    paper_bgcolor: chartColors.background,
    plot_bgcolor: chartColors.background,
    font: {
      family: tokens.typography.fontFamily.primary,
      color: chartColors.text,
      size: 12,
    },
    colorway: [
      chartColors.primary,
      chartColors.secondary,
      chartColors.tertiary,
      chartColors.quaternary,
    ],
    xaxis: {
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    yaxis: {
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    margin: {
      l: 40,
      r: 20,
      t: 40,
      b: 30,
    },
    ...overrides,
  };
};

/**
 * Utility to generate styled component variants based on design tokens
 */
export const generateVariants = (component) => {
  switch (component) {
    case 'button':
      return {
        primary: {
          backgroundColor: tokens.colors.electricCyan,
          color: tokens.colors.midnightNavy,
          borderRadius: tokens.borderRadius.full,
          padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
          fontWeight: tokens.typography.fontWeight.semiBold,
          '&:hover': {
            backgroundColor: tokens.colors.lighterCyan,
          }
        },
        secondary: {
          backgroundColor: 'transparent',
          color: tokens.colors.electricCyan,
          border: `1px solid ${tokens.colors.electricCyan}`,
          borderRadius: tokens.borderRadius.full,
          padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
          fontWeight: tokens.typography.fontWeight.semiBold,
          '&:hover': {
            backgroundColor: `rgba(0, 229, 255, 0.1)`,
          }
        },
        alert: {
          backgroundColor: tokens.colors.signalMagenta,
          color: tokens.colors.cloudWhite,
          borderRadius: tokens.borderRadius.full,
          padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
          fontWeight: tokens.typography.fontWeight.semiBold,
          '&:hover': {
            backgroundColor: tokens.colors.mutedPurple,
          }
        },
      };
    case 'card':
      return {
        default: {
          backgroundColor: tokens.colors.graphite,
          borderRadius: tokens.borderRadius.xl,
          boxShadow: tokens.shadows.md,
          padding: tokens.spacing[4],
        },
        interactive: {
          backgroundColor: tokens.colors.graphite,
          borderRadius: tokens.borderRadius.xl,
          boxShadow: tokens.shadows.md,
          padding: tokens.spacing[4],
          cursor: 'pointer',
          transition: tokens.transitions.default,
          '&:hover': {
            boxShadow: tokens.shadows.lg,
            transform: 'translateY(-2px)',
          }
        },
        anomaly: {
          backgroundColor: tokens.colors.graphite,
          borderRadius: tokens.borderRadius.xl,
          boxShadow: tokens.shadows.md,
          padding: tokens.spacing[4],
          borderLeft: `4px solid ${tokens.colors.signalMagenta}`,
        },
      };
    default:
      return {};
  }
};

export default {
  ThemeProvider,
  useTheme,
  generateChartTheme,
  generateVariants,
  ...tokens,
}; 