/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/components/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-light": "var(--surface-light, var(--surface))",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted, #9ca3af)",
        accent: {
          DEFAULT: "var(--accent)",
          secondary: "var(--accent-secondary, #a78bfa)",
          tertiary: "var(--accent-tertiary, #f472b6)",
          hover: "var(--accent-hover, #56c9ff)",
          "secondary-hover": "var(--accent-secondary-hover, #b59fff)",
        },
        border: "var(--border)",
        "border-light": "var(--border-light, #374151)",
        muted: "var(--muted)",
        success: "var(--success, #10b981)",
        warning: "var(--warning, #f59e0b)",
        error: "var(--error, #ef4444)",
        info: "var(--info, #06b6d4)",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'neo': '0 0 25px rgba(56, 189, 248, 0.15), 0 0 50px rgba(56, 189, 248, 0.08)',
        'neo-hover': '0 0 35px rgba(56, 189, 248, 0.25), 0 0 70px rgba(56, 189, 248, 0.15)',
        'neo-secondary': '0 0 25px rgba(167, 139, 250, 0.15), 0 0 50px rgba(167, 139, 250, 0.08)',
        'neo-tertiary': '0 0 25px rgba(244, 114, 182, 0.15), 0 0 50px rgba(244, 114, 182, 0.08)',
        'inner-neo': 'inset 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.25)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.45)',
      },
      backgroundImage: {
        'gradient-neo': 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)',
        'gradient-surface': 'linear-gradient(135deg, #151926 0%, #1e2433 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0e1a 0%, #151926 100%)',
        'gradient-radial': 'radial-gradient(ellipse at top, #151926, #0a0e1a)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      animation: {
        'pulse-neo': 'pulse-neo 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-neo': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
          },
          '50%': {
            opacity: '0.85',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.35)',
          },
        },
        'glow': {
          from: {
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25), 0 0 25px rgba(56, 189, 248, 0.15)',
          },
          to: {
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.45), 0 0 35px rgba(56, 189, 248, 0.25)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'slide-up': {
          from: {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};
