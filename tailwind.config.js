/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "rgb(9, 9, 11)",
        "primary-text": "rgb(250, 250, 250)",
        secondary: "rgb(241, 245, 249)",
        "secondary-text": "rgb(71, 85, 105)",
        error: "rgb(239, 68, 68)",
        border: "rgb(226, 232, 240)",
        "input-border": "rgb(203, 213, 225)",
        white: "rgb(255, 255, 255)",
        text: "rgb(51, 65, 85)",
        background: "rgb(255, 255, 255)",
        surface: "rgb(241, 245, 249)",

        /* DARK COLORS */
        "primary-dark": "rgb(255,255,255)",
        "primary-text-dark": "rgb(24, 24, 27)",
        "secondary-dark": "rgb(39, 39, 42)",
        "secondary-text-dark": "rgb(212, 212, 216)",
        "error-dark": "rgb(248, 113, 113)",
        "border-dark": "rgb(63, 63, 70)",
        "input-border-dark": "rgb(82, 82, 91)",
        "white-dark": "rgb(0, 0, 0)",
        "text-dark": "rgb(255, 255, 255)",
        "background-dark": "rgb(24, 24, 27)",
        "surface-dark": "rgb(9, 9, 11)"
      }
    },
  },
  plugins: [],
}