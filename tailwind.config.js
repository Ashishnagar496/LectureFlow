/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F9FAFB',
          secondary: '#60A5FA',
          bg: '#0B1120',
          surface: '#111827',
          surfaceHover: '#1F2937',
          text: '#F9FAFB',
          muted: '#9CA3AF',
          success: '#166534',
          border: '#1F2937',
          upcoming: '#60A5FA',
          accent: '#2563EB',
          accentHover: '#1D4ED8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
