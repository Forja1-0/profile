import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        f: {
          black: "#09090B",
          surface: "#111113",
          card: "#161619",
          elevated: "#1C1C20",
          hover: "#232328",
          muted: "#2C2C32",
          green: {
            DEFAULT: "#3A5A40",
            dark: "#2D4532",
            light: "#5B8A64",
            glow: "#abd0af",
            dim: "rgba(58,90,64,0.12)",
          },
          red: {
            DEFAULT: "#7A2832",
            dark: "#5C1E26",
            light: "#A8404D",
            dim: "rgba(122,40,50,0.15)",
          },
          warn: "#C49A3C",
          gold: "#C9A24B",
          text: "#E8E4DC",
          text2: "#8A8680",
          text3: "#524F4A",
          bone: "#D4CFC4",
          border: "rgba(255,255,255,0.05)",
          border2: "rgba(255,255,255,0.09)",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "serif"],
        mono: ['"Space Mono"', "monospace"],
      },
      borderRadius: { sm: "4px", DEFAULT: "8px", md: "8px", lg: "12px", xl: "16px" },
      maxWidth: { content: "1180px" },
    },
  },
  plugins: [],
} satisfies Config;
