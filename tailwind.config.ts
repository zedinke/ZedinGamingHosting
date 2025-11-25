import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern gamer color palette - neon, cyberpunk inspired
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d5ff',
          300: '#a5b8ff',
          400: '#7d94ff',
          500: '#5b6fff',
          600: '#4c5eff',
          700: '#3d4ce8',
          800: '#343fb8',
          900: '#323d93',
        },
        secondary: {
          50: '#fef2ff',
          100: '#fde5ff',
          200: '#fbccff',
          300: '#f7a3ff',
          400: '#f170ff',
          500: '#e83eff',
          600: '#d616ff',
          700: '#b804e6',
          800: '#9805c0',
          900: '#7d0a9e',
        },
        accent: {
          50: '#fff4ed',
          100: '#ffe5d4',
          200: '#ffc7a8',
          300: '#ff9f71',
          400: '#ff6b38',
          500: '#ff4411',
          600: '#f02a07',
          700: '#c71d08',
          800: '#9e1a0f',
          900: '#7f1a10',
        },
        dark: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#0d1117',
        },
        neon: {
          cyan: '#00ffff',
          pink: '#ff00ff',
          green: '#00ff00',
          blue: '#0080ff',
          purple: '#8000ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gamer-pattern': 'linear-gradient(135deg, rgba(91, 111, 255, 0.1) 0%, rgba(232, 62, 255, 0.1) 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(91, 111, 255, 0.5), 0 0 40px rgba(91, 111, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(232, 62, 255, 0.5), 0 0 40px rgba(232, 62, 255, 0.3)',
        'glow': '0 0 15px rgba(91, 111, 255, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;

