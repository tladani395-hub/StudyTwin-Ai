/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './stores/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: 'var(--bg-app)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          sidebar: 'var(--bg-sidebar)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          contrast: 'var(--primary-contrast)',
          glow: 'var(--primary-glow)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          contrast: 'var(--secondary-contrast)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        success: {
          DEFAULT: 'var(--success)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          card: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          border: 'var(--border-subtle)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          hover: 'var(--border-hover)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        }
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'Nunito', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading)', 'Sora', 'Baloo 2', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        explorer: ['Nunito', 'Quicksand', 'sans-serif'],
        scholar: ['Inter', 'system-ui', 'sans-serif'],
        'explorer-heading': ['Baloo 2', 'Fredoka', 'cursive', 'sans-serif'],
        'scholar-heading': ['Sora', 'Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        token: 'var(--radius)',
        card: 'var(--radius-box)',
        btn: 'var(--radius)',
      },
      borderWidth: {
        token: 'var(--border-width)',
      },
      boxShadow: {
        sticker: '4px 4px 0px rgba(0, 0, 0, 0.25)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      }
    },
  },
  plugins: [],
};
