/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cafe-dark': '#4A3A2A',
        'terracota': '#C67B5C',
        'sage': '#8B9B7E',
        'cream': '#E8DCC8',
        'arena': '#D4C4A8',
      },
    },
  },
  plugins: [],
}
