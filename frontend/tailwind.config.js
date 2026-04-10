/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          surface: 'var(--color-bg-surface)',
          'surface-hover': 'var(--color-bg-surface-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent-primary)',
          hover: 'var(--color-accent-primary-hover)',
          muted: 'var(--color-accent-primary-muted)',
          glow: 'var(--color-accent-primary-glow)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border-default)',
          hover: 'var(--color-border-hover)',
          active: 'var(--color-border-active)',
        },
        status: {
          success: 'var(--color-status-success)',
          warning: 'var(--color-status-warning)',
          error: 'var(--color-status-error)',
          pending: 'var(--color-status-pending)',
          info: 'var(--color-status-info)',
        },
      },
      fontFamily: {
        display: ['Syne', 'Arial Black', 'sans-serif'],
        mono: ['Martian Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(4rem, 10vw, 8rem)',
      },
      boxShadow: {
        glow: '0 0 30px rgba(255, 79, 0, 0.15), 0 0 60px rgba(255, 79, 0, 0.05)',
        'glow-intense': '0 0 40px rgba(255, 79, 0, 0.3), 0 0 80px rgba(255, 79, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
