/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Blue-600
          dark: '#1d4ed8', // Blue-700
          light: '#3b82f6', // Blue-500
        },
        secondary: {
          DEFAULT: '#4b5563', // Gray-600
          dark: '#374151', // Gray-700
          light: '#6b7280', // Gray-500
        },
        success: {
          DEFAULT: '#16a34a', // Green-600
          dark: '#15803d', // Green-700
          light: '#22c55e', // Green-500
        },
        warning: {
          DEFAULT: '#ca8a04', // Yellow-600
          dark: '#a16207', // Yellow-700
          light: '#eab308', // Yellow-500
        },
        error: {
          DEFAULT: '#dc2626', // Red-600
          dark: '#b91c1c', // Red-700
          light: '#ef4444', // Red-500
        },
        // Dark mode spezifische Farben
        dark: {
          background: '#121212',
          card: '#1e1e1e',
          border: '#2d2d2d',
          text: '#e0e0e0',
          hover: '#2a2a2a',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
