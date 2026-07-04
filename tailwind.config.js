/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        text: "#161616",
        background: "#ffffff",
        primary: "#09090b",
        "primary-text": "#fafafa",
        secondary: "#f1f5f9",
        "secondary-text": "#475569",
        surface: "#f1f5f9",
        error: "#ef4444",
        border: "#e2e8f0",
        "input-border": "#cbd5e1",
        white: "#ffffff",
        black: "#000000",


        /* DARK COLORS */
        "primary-dark": "#ffffff",
        "primary-text-dark": "#18181b",
        "secondary-dark": "#27272a",
        "secondary-text-dark": "#d4d4d8",
        "error-dark": "#f87171",
        "border-dark": "#3f3f46",
        "input-border-dark": "#52525b",
        "white-dark": "#000000",
        "text-dark": "#ffffff",
        "background-dark": "#18181b",
        "surface-dark": "#09090b",
        "black-dark": "#000000",
      }
    },
  },
  plugins: [],
}