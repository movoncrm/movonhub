import type { Config } from "tailwindcss";

/**
 * MOVONHUB design tokens.
 *
 * Source of truth: `MovonHub Logo.png` — an "MH" monogram in a blue gradient
 * (#1E7BFF → #0B4FD8) with a slate/grey gradient (#5B6B7F → #2B3947) on an
 * off-white surface. Semantic tokens are exposed as CSS variables (see
 * src/app/globals.css) and mapped here. The legacy `movon-*` scale is retained
 * (with values aligned to the reference) so existing components keep working.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Values mirror the CSS variables in src/app/globals.css. Declared as hex
      // (not var()) so Tailwind opacity modifiers (e.g. bg-primary/10) work.
      colors: {
        primary: {
          DEFAULT: "#1E7BFF",
          dark: "#0B4FD8",
          deep: "#0A3FA8",
          soft: "#E8F1FF",
        },
        secondary: {
          DEFAULT: "#5B6B7F",
          dark: "#2B3947",
        },
        accent: "#FFB600",
        background: "#F5F7FA",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        borderline: "#E4E8EE",
        ink: "#1F2A37",
        muted: "#6B7280",
        success: "#16A34A",
        warning: "#D97706",
        destructive: "#DC2626",
        focusring: "#1E7BFF",
        movon: {
          blue: "#1E7BFF",
          blueDark: "#0B4FD8",
          blueDeep: "#0A3FA8",
          slate: "#5B6B7F",
          slateDark: "#2B3947",
          gold: "#FFB600",
          orange: "#FF6900",
          ink: "#2B3947",
          inkSoft: "#1E2833",
          paper: "#F5F7FA",
          muted: "#6B7280",
          line: "#E4E8EE",
        },
        // Dark landing surface scale (MOVONHUB dark theme)
        night: "#050816",
        "night-soft": "#080D20",
        "night-card": "#0C1430",
        "night-elevated": "#111C3A",
        electric: "#4C91FF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1200px",
      },
      boxShadow: {
        card: "0 18px 48px -28px rgba(20,32,50,.28)",
        lift: "0 30px 60px -34px rgba(11,79,216,.42)",
        soft: "0 10px 30px -20px rgba(20,32,50,.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
