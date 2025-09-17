"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  applyTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark-neo",
}) => {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme(defaultTheme);
    }
  }, [defaultTheme]);

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove(
      "theme-dark-neo",
      "theme-light-professional", 
      "theme-modern-minimal",
      "theme-corporate-blue",
      "theme-warm-neutral",
      "theme-high-contrast",
      "theme-soft-pastel"
    );
    
    // Add new theme class
    root.classList.add(`theme-${themeId}`);
    
    // Update CSS custom properties based on theme
    switch (themeId) {
      case "dark-neo":
        // Explicitly restore Dark Neo variables when switching back
        root.style.setProperty("--background", "#0a0e1a");
        root.style.setProperty("--surface", "#151926");
        root.style.setProperty("--surface-light", "#1e2433");
        root.style.setProperty("--foreground", "#e8eaed");
        root.style.setProperty("--foreground-muted", "#9ca3af");
        root.style.setProperty("--muted", "#6b7280");
        root.style.setProperty("--accent", "#38bdf8");
        root.style.setProperty("--accent-secondary", "#a78bfa");
        root.style.setProperty("--accent-tertiary", "#f472b6");
        root.style.setProperty("--accent-hover", "#56c9ff");
        root.style.setProperty("--accent-secondary-hover", "#b59fff");
        root.style.setProperty("--border", "#2a3142");
        root.style.setProperty("--border-light", "#374151");
        root.style.setProperty("--success", "#10b981");
        root.style.setProperty("--warning", "#f59e0b");
        root.style.setProperty("--error", "#ef4444");
        root.style.setProperty("--info", "#06b6d4");
        root.style.setProperty("--card", "#151926");
        root.style.setProperty("--card-foreground", "#e8eaed");
        break;
        
      case "light-professional":
        root.style.setProperty("--background", "#ffffff");
        root.style.setProperty("--surface", "#f8fafc");
        
        root.style.setProperty("--foreground", "#1e293b");
        root.style.setProperty("--muted", "#64748b");
        root.style.setProperty("--accent", "#3b82f6");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#e5e7eb");
        root.style.setProperty("--card", "#ffffff");
        root.style.setProperty("--card-foreground", "#1e293b");
        break;
        
      case "modern-minimal":
        root.style.setProperty("--background", "#fafafa");
        root.style.setProperty("--surface", "#ffffff");
        
        root.style.setProperty("--foreground", "#2d3748");
        root.style.setProperty("--muted", "#718096");
        root.style.setProperty("--accent", "#8b5cf6");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#f1f5f9");
        root.style.setProperty("--card", "#ffffff");
        root.style.setProperty("--card-foreground", "#2d3748");
        break;
        
      case "corporate-blue":
        root.style.setProperty("--background", "#f1f5f9");
        root.style.setProperty("--surface", "#ffffff");
        
        root.style.setProperty("--foreground", "#1e3a8a");
        root.style.setProperty("--muted", "#475569");
        root.style.setProperty("--accent", "#2563eb");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#cbd5e1");
        root.style.setProperty("--card", "#ffffff");
        root.style.setProperty("--card-foreground", "#1e3a8a");
        break;
        
      case "warm-neutral":
        root.style.setProperty("--background", "#fefefe");
        root.style.setProperty("--surface", "#fafaf9");
        
        root.style.setProperty("--foreground", "#44403c");
        root.style.setProperty("--muted", "#78716c");
        root.style.setProperty("--accent", "#ea580c");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#d6d3d1");
        root.style.setProperty("--card", "#fafaf9");
        root.style.setProperty("--card-foreground", "#44403c");
        break;
        
      case "high-contrast":
        root.style.setProperty("--background", "#ffffff");
        root.style.setProperty("--surface", "#ffffff");
        
        root.style.setProperty("--foreground", "#000000");
        root.style.setProperty("--muted", "#374151");
        root.style.setProperty("--accent", "#dc2626");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#d1d5db");
        root.style.setProperty("--card", "#ffffff");
        root.style.setProperty("--card-foreground", "#000000");
        break;
        
      case "soft-pastel":
        root.style.setProperty("--background", "#faf7ff");
        root.style.setProperty("--surface", "#ffffff");
        
        root.style.setProperty("--foreground", "#581c87");
        root.style.setProperty("--muted", "#6b7280");
        root.style.setProperty("--accent", "#8b5cf6");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--border", "#e9d5ff");
        root.style.setProperty("--card", "#ffffff");
        root.style.setProperty("--card-foreground", "#581c87");
        break;
        
      default:
        // Reset to default dark neo
        root.style.removeProperty("--background");
        root.style.removeProperty("--surface");
        root.style.removeProperty("--foreground");
        root.style.removeProperty("--muted");
        root.style.removeProperty("--accent");
        root.style.removeProperty("--accent-foreground");
        root.style.removeProperty("--border");
        root.style.removeProperty("--card");
        root.style.removeProperty("--card-foreground");
    }
  };

  const setTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("dashboard-theme", themeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
