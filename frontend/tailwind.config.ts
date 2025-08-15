import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e6edff',
          200: '#d1dbff',
          300: '#b1c3ff',
          400: '#8b9eff',
          500: '#6c7aff',
          600: '#5a67f5',
          700: '#4c5ae0',
          800: '#3f4ab5',
          900: '#374190',
          950: '#252954',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fbe8ff',
          200: '#f7d2ff',
          300: '#f0abff',
          400: '#e879ff',
          500: '#dc4cff',
          600: '#c230e2',
          700: '#a123bf',
          800: '#851f9a',
          900: '#6e1c7d',
          950: '#49085a',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'typing': 'typing 1.4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        typing: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #0f0f23 0%, #16213e 50%, #0f3460 100%)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e5e7eb',
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config