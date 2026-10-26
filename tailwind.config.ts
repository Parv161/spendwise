import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          subtle: "#131d35",
        },
        popover: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
        },
        primary: {
          DEFAULT: "#10b981", // emerald-500
          foreground: "#042f2e",
          hover: "#059669",
          muted: "rgba(16, 185, 129, 0.15)",
        },
        secondary: {
          DEFAULT: "#4d7c0f", // olive / lime-700
          foreground: "#f7fee7",
          hover: "#3f6212",
          muted: "rgba(77, 124, 15, 0.15)",
        },
        muted: {
          DEFAULT: "#1e293b",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
          olive: "#84cc16",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          muted: "rgba(239, 68, 68, 0.15)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
          muted: "rgba(245, 158, 11, 0.15)",
        },
        border: "#1e293b",
        input: "#1e293b",
        ring: "#10b981",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
