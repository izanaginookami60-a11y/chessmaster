import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#312E2B",
          secondary: "#272522",
          tertiary: "#21201D",
          hover: "#3C3835",
          active: "#4A4643",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A0A0A0",
          muted: "#6B6966",
        },
        accent: {
          primary: "#81B64C",
          secondary: "#E5A249",
          link: "#6BA4D9",
        },
        board: {
          light: "#EBECD0",
          dark: "#779556",
          highlight: "#F6F669",
          legal: "rgba(0,0,0,0.1)",
          check: "#FF0000",
          premove: "#0066CC",
        },
        rating: {
          bullet: "#3B82F6",
          blitz: "#EAB308",
          rapid: "#22C55E",
          daily: "#F97316",
          puzzle: "#A855F7",
        },
        result: {
          win: "#81B64C",
          loss: "#FA412D",
          draw: "#A0A0A0",
        },
        evalcolor: {
          brilliant: "#26C2A3",
          great: "#5B8BB6",
          best: "#96BC4B",
          good: "#96BC4B",
          book: "#A88B65",
          inaccuracy: "#E6A317",
          mistake: "#E68A17",
          blunder: "#CA3431",
        },
        light: {
          bgPrimary: "#F0F0F0",
          bgSecondary: "#FFFFFF",
          textPrimary: "#312E2B",
          textSecondary: "#6B6966",
        },
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      keyframes: {
        flash: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        flash: "flash 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
