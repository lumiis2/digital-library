/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['PixelFont', 'sans-serif'],
        body: ['BodyFont', 'sans-serif'],
      },
      colors: {
         preto: '#1A1A1A',    // floresta
         cinza: '#2E2E2E',     // madeira
         verde: '#9CA986',       //  musgo
         azul: '#1E2A44',   // azulLivro
         neblina: '#6B7A8F', // douradoSol
         branco: '#FDFCF9',       // papel
      },
    },
  },
  plugins: [],
};