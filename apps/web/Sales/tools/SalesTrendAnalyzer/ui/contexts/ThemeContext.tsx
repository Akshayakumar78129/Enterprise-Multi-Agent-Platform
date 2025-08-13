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
  // Background colors
  bg: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    card: '#1e293b',
    glass: 'rgba(30, 41, 59, 0.85)',
    overlay: 'rgba(255, 255, 255, 0.1)'
  },
  
  // Text colors
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#1e293b'
  },
  
  // Border colors
  border: {
    light: '#334155',
    medium: '#475569',
    strong: '#64748b'
  },
  
  // Accent colors (slightly brighter for dark mode)
  accent: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#22d3ee'
  },
  
  // Chat specific colors
  chat: {
    userMessage: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    botMessage: 'rgba(30, 41, 59, 0.95)',
    agentMessage: 'rgba(30, 41, 59, 0.98)',
    panel: 'rgba(15, 23, 42, 0.95)',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  
  // Agent colors (slightly brighter for dark mode)
  agents: {
    sales: '#60a5fa',     // Brighter blue
    customer: '#34d399',  // Brighter green
    finance: '#a78bfa',   // Brighter purple
    inventory: '#fbbf24'  // Brighter amber
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