/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gitgry: {
          bg: '#0d1117',
          surface: '#161b22',
          card: '#1c2128',
          border: '#30363d',
          accent: '#238636',
          'accent-hover': '#2ea043',
          blue: '#58a6ff',
          purple: '#bc8cff',
          muted: '#8b949e',
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

