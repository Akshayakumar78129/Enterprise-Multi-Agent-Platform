import React, { createContext, useContext, useState, useEffect } from 'react';

// Professional color themes
export const lightTheme = {
  // Background colors
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    card: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.1)'
  },
  
  // Text colors  
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff'
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    strong: '#94a3b8'
  },
  
  // Accent colors (professional, muted)
  accent: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  },
  
  // Chat specific colors
  chat: {
    userMessage: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    botMessage: 'rgba(248, 250, 252, 0.95)',
    agentMessage: 'rgba(248, 250, 252, 0.98)',
    panel: 'rgba(255, 255, 255, 0.95)',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  
  // Agent colors (professional, muted)
  agents: {
    sales: '#3b82f6',     // Professional blue
    customer: '#10b981',  // Professional green
    finance: '#8b5cf6',   // Professional purple  
    inventory: '#f59e0b'  // Professional amber
  }
};

export const darkTheme = {
  // Background colors (aligned to Sales dashboard palette)
  bg: {
    primary: '#232a36',     // Base Background (Graphite)
    secondary: '#2c3341',   // Container Background
    tertiary: '#0a1224',    // Interactive Background
    card: '#2c3341',
    glass: 'rgba(44, 51, 65, 0.95)',
    overlay: 'rgba(247, 249, 251, 0.08)'
  },
  
  // Text colors
  text: {
    primary: '#f7f9fb',
    secondary: 'rgba(247, 249, 251, 0.75)',
    tertiary: 'rgba(247, 249, 251, 0.6)',
    inverse: '#0a1224'
  },
  
  // Border colors
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.2)'
  },
  
  // Accent colors
  accent: {
    primary: '#00e0ff',
    secondary: '#e930ff',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#22d3ee'
  },
  
  // Chat specific colors
  chat: {
    userMessage: 'linear-gradient(135deg, #00e0ff, #e930ff)',
    botMessage: 'rgba(44, 51, 65, 0.95)',
    agentMessage: 'rgba(44, 51, 65, 0.98)',
    panel: 'rgba(35, 42, 54, 0.95)',
    shadow: 'rgba(0, 0, 0, 0.35)'
  },
  
  // Agent colors
  agents: {
    sales: '#00e0ff',
    customer: '#22c55e',
    finance: '#a78bfa',
    inventory: '#f59e0b'
  }
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('sales-dashboard-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('sales-dashboard-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};