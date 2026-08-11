/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vaultDark: '#0B0F17',
        vaultCard: '#161B26',
        vaultAccent: '#3B82F6',
      }
    },
  },
  plugins: [],
}