/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* ── Brand Blues ── */
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        /* ── Gold Accent ── */
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
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
        'ios':       '0 2px 8px rgba(0,0,0,0.4)',
        'ios-lg':    '0 8px 24px rgba(0,0,0,0.5)',
        'ios-xl':    '0 20px 60px rgba(0,0,0,0.7)',
        'glow':      '0 0 24px rgba(59,130,246,0.2)',
        'glow-lg':   '0 0 40px rgba(59,130,246,0.3)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.25)',
        'card':      '0 4px 12px rgba(0,0,0,0.5)',
        'card-lg':   '0 8px 32px rgba(0,0,0,0.6)',
        'glass':     '0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        /* Legacy aliases */
        'glow-primary': '0 0 20px rgba(59,130,246,0.3)',
        'glow-accent':  '0 0 20px rgba(245,158,11,0.3)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(59,130,246,0.2)' },
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
        'gradient-brand': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        'gradient-gold':  'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
        'gradient-dark':  'linear-gradient(135deg, #10161E 0%, #0A0F14 100%)',
      },
    },
  },
  plugins: [],
}