/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        primaryDark: '#1e3a8a',
        primaryLight: '#60a5fa',
        secondary: '#10b981',
        accent: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        soldOut: '#6b7280',
        available: '#10b981',
        successLight: '#d1fae5',
        dangerLight: '#fee2e2',
        warningLight: '#fef3c7',
        infoLight: '#dbeafe',
      },
    },
  },
  plugins: [],
}
