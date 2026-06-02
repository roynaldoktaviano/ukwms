import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        warn: "var(--warn)",
        "warn-soft": "var(--warn-soft)",
        // Sidebar (admin) ink theme
        nav: "var(--nav)",
        "nav-soft": "var(--nav-soft)",
        "nav-line": "var(--nav-line)",
        "nav-text": "var(--nav-text)",
        "nav-muted": "var(--nav-muted)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,32,30,0.04), 0 8px 24px -16px rgba(20,32,30,0.18)",
        pop: "0 24px 60px -24px rgba(20,32,30,0.35)",
        focus: "0 0 0 3px var(--primary-soft)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulse_ring: {
          "0%": { boxShadow: "0 0 0 0 var(--success-soft)" },
          "70%": { boxShadow: "0 0 0 8px rgba(0,0,0,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .4s ease both",
        "scale-in": "scale-in .2s ease both",
        "pulse-ring": "pulse_ring 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
