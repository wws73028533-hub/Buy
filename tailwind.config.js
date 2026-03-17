/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f5ff',
          100: '#efedff',
          200: '#ddd8ff',
          300: '#c3b7ff',
          400: '#a38cff',
          500: '#825cf8',
          600: '#6f3ee9',
          700: '#5f30c9',
          800: '#4f2aa3',
          900: '#422682',
        },
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
