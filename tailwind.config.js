/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.html",
    "./frontend/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#ec4899',
        accent: '#06b6d4',
      },
    },
  },
  plugins: [],
}

