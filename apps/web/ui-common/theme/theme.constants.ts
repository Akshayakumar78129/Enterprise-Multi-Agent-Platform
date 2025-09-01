export const theme = {
  colors: {
    // Primary colors - matching churn dashboard
    background: {
      primary: '#0a1224',
      secondary: '#0d1a2d',
      card: '#1e2738',
      cardHover: '#232a36',
      overlay: 'rgba(10, 18, 36, 0.9)',
      gradient: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
    },
    text: {
      primary: '#f7f9fb',
      secondary: 'rgba(247, 249, 251, 0.7)',
      muted: 'rgba(247, 249, 251, 0.5)',
      inverse: '#0a1224',
    },
    accent: {
      primary: '#00e0ff',
      secondary: '#00b8d4',
      tertiary: '#00acc1',
      glow: 'rgba(0, 224, 255, 0.3)',
      gradient: 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
    },
    status: {
      success: '#00ff88',
      warning: '#ffd600',
      error: '#ff5252',
      info: '#00e0ff',
      critical: '#ff1744',
    },
    risk: {
      veryHigh: '#ff1744',
      high: '#ff9800',
      medium: '#ffc107',
      low: '#4caf50',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.1)',
      active: '#00e0ff',
      subtle: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 224, 255, 0.3)',
    card: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
};

export const animations = {
  spin: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(0, 224, 255, 0.5); }
      50% { box-shadow: 0 0 20px rgba(0, 224, 255, 0.8); }
    }
  `,
};

export default theme;