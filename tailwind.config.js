/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'treaty-dark': '#0a0a0a',
        'treaty-neon': '#39ff14', 
        'treaty-accent': '#ff007f',
      },
    },
  },
  plugins: [],
}