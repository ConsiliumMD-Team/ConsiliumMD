/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clinical: {
          950: '#060B13',
          900: '#0B1528',
          850: '#101F3B',
          800: '#172B52',
          700: '#233F75',
          cyan: '#00F2FE',
          teal: '#4FACFE',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#8B5CF6'
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite'
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.8))' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.12)' },
          '70%': { transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
