import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        elevated: "var(--color-elevated)",
        primary: "#635BFF",
        secondary: "#3FD0FF",
        accent: "#FF5C8A",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        "text-dim": "var(--color-text-dim)",
        success: "#34d399",
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
        hover: "var(--color-border-hover)",
      },
      boxShadow: {
        card: "0 32px 80px rgba(0,0,0,0.6)",
        sm: "0 8px 24px rgba(0,0,0,0.4)",
        primary: "0 0 0 1px rgba(99,91,255,0.3), 0 4px 16px rgba(99,91,255,0.3)",
        "primary-hover": "0 0 0 1px rgba(99,91,255,0.4), 0 8px 24px rgba(99,91,255,0.4)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #635BFF, #3FD0FF)",
        "gradient-hero": "linear-gradient(135deg, #fff 0%, #635BFF 50%, #3FD0FF 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease both",
        pulse2: "pulse2 2s ease infinite",
        "page-in": "pageFadeIn 0.25s ease both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        pageFadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

