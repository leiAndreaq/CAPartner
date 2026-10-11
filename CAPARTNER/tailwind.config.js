/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#012b10',
          forest: '#053D1C',
          green: '#064018',
          deep: '#033015',
        },
      },
    },
  },
  plugins: [],
}