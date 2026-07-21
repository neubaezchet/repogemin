/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        /* ── Brand Índigo ── */
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        /* ── Violeta Accent ── */
        gold: {
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
        },
        /* ── Emerald ── */
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        /* ── Surfaces ── */
        surface: {
          primary:  'var(--bg-card-solid)',
          elevated: 'var(--bg-card-elevated)',
          input:    'var(--bg-input)',
          border:   'var(--border-primary)',
          hover:    'var(--bg-hover)',
          sidebar:  'var(--bg-sidebar)',
        },
      },
      borderRadius: {
        'ios':    '14px',
        'ios-lg': '20px',
        'ios-xl': '28px',
      },
      boxShadow: {
        'ios':       '0 1px 3px rgba(15,23,42,0.08)',
        'ios-lg':    '0 8px 24px rgba(15,23,42,0.10)',
        'ios-xl':    '0 20px 60px rgba(15,23,42,0.12)',
        'glow':      '0 0 24px rgba(79,70,229,0.2)',
        'glow-lg':   '0 0 40px rgba(79,70,229,0.3)',
        'glow-gold': '0 0 20px rgba(124,58,237,0.25)',
        'card':      '0 4px 12px rgba(15,23,42,0.08)',
        'card-lg':   '0 8px 32px rgba(15,23,42,0.10)',
        'glass':     '0 24px 60px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        /* Legacy aliases */
        'glow-primary': '0 0 20px rgba(79,70,229,0.3)',
        'glow-accent':  '0 0 20px rgba(124,58,237,0.3)',
      },
      backdropBlur: {
        'ios': '20px',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(79,70,229,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'gradient-gold':  'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
        'gradient-dark':  'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
}