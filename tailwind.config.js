/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Principal
        'black': '#000000',
        'white': '#ffffff',
        'gray-warm': '#aeaa9f',
        'gray-light': '#efefef',
        'cream': '#f5f0e8',
        // Paleta Alternativa
        'beige': '#d6cfc4',
        'camel': '#b89b7a',
        'brown': '#7a6a58',
        'sage': '#8f9b8a',
        'silver': '#c7c7c5',
        'gray-mid': '#9a9a96',
        'charcoal': '#4a4a48',
        'gray-green': '#bfc0be',
        'steel': '#7f8a92',
        'olive': '#9aa79a',
        'sand': '#cfcac2',
        'dark': '#2f2f2e',
        // Categorías
        'cat-parques': '#7ed957',
        'cat-restaurante': '#9b59b6',
        'cat-nocturna': '#85c1e9',
        'cat-cafeteria': '#f5a623',
        'cat-cultura': '#e84393',
        'cat-favoritos': '#f1c40f',
        // Mapa
        'map-road': '#B59E7D',
        'map-bg': '#F9F9F9',
        'map-water': '#9EE4FE',
        'map-park': '#DEF7E2',
      },
      fontFamily: {
        'heading': ['Libre Baskerville', 'Georgia', 'serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
