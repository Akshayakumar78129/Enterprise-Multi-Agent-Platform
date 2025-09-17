"use client";

import React, { useState, useRef, useEffect } from "react";

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const themes: Theme[] = [
  {
    id: "dark-neo",
    name: "Dark Neo",
    description: "Current dark theme with glossy effects",
    preview: {
      primary: "#1e293b",
      secondary: "#334155",
      accent: "#38bdf8",
      background: "#0f172a",
    },
  },
  {
    id: "light-professional",
    name: "Light Professional",
    description: "Clean white with professional blue accents",
    preview: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      accent: "#3b82f6",
      background: "#ffffff",
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Off-white with vibrant purple accents",
    preview: {
      primary: "#fafafa",
      secondary: "#ffffff",
      accent: "#8b5cf6",
      background: "#fafafa",
    },
  },
  {
    id: "corporate-blue",
    name: "Corporate Blue",
    description: "Light blue-gray with corporate styling",
    preview: {
      primary: "#f1f5f9",
      secondary: "#ffffff",
      accent: "#2563eb",
      background: "#f1f5f9",
    },
  },
  {
    id: "warm-neutral",
    name: "Warm Neutral",
    description: "Warm white with orange accents",
    preview: {
      primary: "#fefefe",
      secondary: "#fafaf9",
      accent: "#ea580c",
      background: "#fefefe",
    },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Pure white with strong black contrast",
    preview: {
      primary: "#ffffff",
      secondary: "#ffffff",
      accent: "#dc2626",
      background: "#ffffff",
    },
  },
  {
    id: "soft-pastel",
    name: "Soft Pastel",
    description: "Light lavender with purple accents",
    preview: {
      primary: "#faf7ff",
      secondary: "#ffffff",
      accent: "#8b5cf6",
      background: "#faf7ff",
    },
  },
];

export interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentThemeData = themes.find(theme => theme.id === currentTheme) || themes[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-background/50 transition-colors"
        suppressHydrationWarning
      >
        {/* Theme Preview */}
        <div className="flex gap-1">
          <div
            className="w-3 h-3 rounded-full border border-border/50"
            style={{ backgroundColor: currentThemeData.preview.primary }}
          />
          <div
            className="w-3 h-3 rounded-full border border-border/50"
            style={{ backgroundColor: currentThemeData.preview.accent }}
          />
        </div>
        
        {/* Theme Name */}
        <span className="text-sm font-medium">{currentThemeData.name}</span>
        
        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-muted transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-neo z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Choose Theme</h3>
            <p className="text-xs text-muted mt-1">Select a theme for your dashboard</p>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full p-3 text-left hover:bg-background/50 transition-colors border-b border-border/30 last:border-b-0 ${
                  currentTheme === theme.id ? "bg-accent/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Theme Preview */}
                  <div className="flex gap-1 shrink-0">
                    <div
                      className="w-4 h-4 rounded border border-border/50"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded border border-border/50"
                      style={{ backgroundColor: theme.preview.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded border border-border/50"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                  </div>
                  
                  {/* Theme Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {theme.name}
                      </span>
                      {currentTheme === theme.id && (
                        <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1">{theme.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
