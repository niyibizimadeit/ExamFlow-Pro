import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans:    ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        parchment: {
          50:  "#fdfaf4",
          100: "#f9f2e3",
          200: "#f0e3c8",
          300: "#e4ceaa",
          400: "#d4b483",
          500: "#c49a60",
        },
        amber: {
          accent: "#b5732a",
        },
        terracotta: "#a85438",
        ink: {
          900: "#1c1612",
          700: "#3d3026",
          500: "#6b5744",
          300: "#a8917e",
          100: "#d9c9bb",
        },
      },
      borderRadius: {
        "2xl": "14px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(28,22,18,0.06), 0 4px 16px rgba(168,84,56,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
        "card-hover": "0 2px 8px rgba(28,22,18,0.08), 0 8px 32px rgba(181,115,42,0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
        "btn-amber": "0 2px 8px rgba(181,115,42,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;