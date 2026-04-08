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
        // ── Brand Palette ──────────────────────────────────
        // Primary: Bondi Blue (CTAs, active states, links)
        // Warning: Lime Cream (alerts, caution)
        // Success: Light Green (approved, complete)
        // Error: Cerulean (rejected, critical)
        // Backgrounds: Baltic Blue (deep navy)
        // Text: Ocean Mist (soft teal-white)
        // Borders: Tropical Teal
        brand: {
          // Primary action / accent
          primary: "#1db4e2", // bondi-blue-500
          "primary-dim": "#1790b5", // bondi-blue-600
          "primary-light": "#4ac3e8", // bondi-blue-400

          // Warning / attention
          warning: "#b4db24", // lime-cream-500
          "warning-dim": "#90af1d", // lime-cream-600
          "warning-light": "#c3e250", // lime-cream-400

          // Success / approved
          success: "#55bf40", // light-green-500
          "success-dim": "#449933", // light-green-600
          "success-light": "#77cc66", // light-green-400

          // Error / critical
          error: "#24a1db", // cerulean-500
          "error-dim": "#1d81af", // cerulean-600
          "error-light": "#50b4e2", // cerulean-400

          // Info
          info: "#3dbdc2", // tropical-teal-500
          "info-dim": "#31989b", // tropical-teal-600

          // Backgrounds (Baltic Blue)
          "dark-slate": "#06131e", // baltic-blue-950
          slate: "#091c2a", // baltic-blue-900
          "slate-light": "#113755", // baltic-blue-800
          "slate-lighter": "#1a537f", // baltic-blue-700
        },

        // ── Text Colors (Ocean Mist) ─────────────────────
        text: {
          primary: "#dbf0ea", // ocean-mist-100
          secondary: "#93d2c0", // ocean-mist-300
          tertiary: "#6fc3ab", // ocean-mist-400
          inverse: "#06131e", // baltic-blue-950
        },

        // ── Border Colors (Tropical Teal) ────────────────
        border: {
          DEFAULT: "#1e483c", // tropical-teal-800
          light: "#257274", // tropical-teal-700
        },
      },

      fontFamily: {
        display: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
        body: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },

      backgroundColor: {
        page: "#06131e", // baltic-blue-950
        card: "#091c2a", // baltic-blue-900
        "card-hover": "#113755", // baltic-blue-800
        "card-active": "#1a537f", // baltic-blue-700
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
