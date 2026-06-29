/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.tsx",
    "./*.ts",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./logic/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
