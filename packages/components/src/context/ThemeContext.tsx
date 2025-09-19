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
  defaultTheme = "soft-pastel",
}) => {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    // Force applying the provided default theme to avoid initial flash
    setCurrentTheme(defaultTheme);
    applyTheme(defaultTheme);
    try {
      localStorage.setItem("dashboard-theme", defaultTheme);
    } catch {}
  }, [defaultTheme]);

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    // Apply only via data-theme to match CSS tokens; avoid inline overrides
    root.setAttribute("data-theme", themeId);
    // Maintain a theme-* class for optional styling hooks
    [
      "theme-dark-neo",
      "theme-light-professional",
      "theme-modern-minimal",
      "theme-corporate-blue",
      "theme-warm-neutral",
      "theme-high-contrast",
      "theme-soft-pastel",
    ].forEach(cls => root.classList.remove(cls));
    root.classList.add(`theme-${themeId}`);
    // Clear any previously set inline variables which could conflict
    const cssVars = [
      "--background","--surface","--surface-light","--foreground","--foreground-muted",
      "--muted","--accent","--accent-secondary","--accent-tertiary","--accent-hover",
      "--accent-secondary-hover","--border","--border-light","--success","--warning",
      "--error","--info","--card","--card-foreground"
    ];
    cssVars.forEach(v => root.style.removeProperty(v));
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
