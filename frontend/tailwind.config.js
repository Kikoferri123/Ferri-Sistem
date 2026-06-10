/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#fafafa', 100: '#e5e5e5', 200: '#d4d4d4', 300: '#a3a3a3', 400: '#737373', 500: '#525252', 600: '#404040', 700: '#2d2d2d', 800: '#1a1a1a', 900: '#0a0a0a' },
        ferri: { dark: '#0a0a0a', medium: '#1a1a1a', light: '#d4af37', accent: '#d4af37' }
      }
    }
  },
  plugins: []
}
