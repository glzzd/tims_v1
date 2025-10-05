import { defineConfig } from 'tailwindcss'


export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       fontFamily: {
       dmsans: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      animation: {
        floaty: "floaty 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
