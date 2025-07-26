import React, { createContext, useContext, ReactNode } from 'react';

// Theme interface
interface Theme {
  colors: {
    midnight: string;
    graphite: string;
    graphiteDark: string;
    cloudWhite: string;
    electricCyan: string;
    signalMagenta: string;
    success: string;
    error: string;
    warning: string;
    neutral: string;
  };
  typography: {
    fontFamily: string;
    monoFontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      regular: number;
      medium: number;
      semiBold: number;
      bold: number;
    };
  };
  spacing: number[];
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Enterprise IQ theme definition
export const enterpriseIQTheme: Theme = {
  colors: {
    midnight: '#0a1224',
    graphite: '#232a36',
    graphiteDark: '#3a4459',
    cloudWhite: '#f7f9fb',
    electricCyan: '#00e0ff',
    signalMagenta: '#e930ff',
    success: '#00C853',
    error: '#FF5252',
    warning: '#FFD740',
    neutral: '#757575'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    monoFontFamily: 'JetBrains Mono, monospace',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700
    }
  },
  spacing: [0, 4, 8, 16, 24, 32, 48, 64, 96, 128],
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.25)'
  }
};

// Create theme context
const ThemeContext = createContext<Theme>(enterpriseIQTheme);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children,
  theme = enterpriseIQTheme
}) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for accessing theme
export const useTheme = () => useContext(ThemeContext); 