/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['PixelFont', 'sans-serif'],
      },
      colors: {
        floresta: '#2E4630',
        madeira: '#5C4033',
        musgo: '#8B9A46',
        azulLivro: '#2B4A83',
        douradoSol: '#D9A441',
        papel: '#F4EBD0',
      },
    },
  },
  plugins: [],
};