import React, { createContext, useContext, ReactNode } from 'react';
import { theme } from './theme.constants';

interface ThemeContextType {
  theme: typeof theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  customTheme?: Partial<typeof theme>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  customTheme 
}) => {
  const mergedTheme = customTheme 
    ? { ...theme, ...customTheme } 
    : theme;

  return (
    <ThemeContext.Provider value={{ theme: mergedTheme }}>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: ${mergedTheme.typography.fontFamily};
          background: ${mergedTheme.colors.background.gradient};
          color: ${mergedTheme.colors.text.primary};
          min-height: 100vh;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${mergedTheme.colors.background.secondary};
        }

        ::-webkit-scrollbar-thumb {
          background: ${mergedTheme.colors.accent.primary};
          border-radius: ${mergedTheme.borderRadius.full};
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${mergedTheme.colors.accent.secondary};
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px ${mergedTheme.colors.accent.glow}; }
          50% { box-shadow: 0 0 20px ${mergedTheme.colors.accent.glow}; }
        }

        .glass-effect {
          background: rgba(30, 39, 56, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid ${mergedTheme.colors.border.default};
        }

        .gradient-text {
          background: ${mergedTheme.colors.accent.gradient};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hover-glow {
          transition: all ${mergedTheme.transitions.normal};
        }

        .hover-glow:hover {
          box-shadow: ${mergedTheme.shadows.glow};
          transform: translateY(-2px);
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;