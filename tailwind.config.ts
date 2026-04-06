import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        loure: {
          primary: "#1e3a8a",
          secondary: "#3b82f6",
          accent: "#60a5fa",
          dark: "#0f172a",
          light: "#f8fafc",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        loure: {
          primary: "#1e3a8a",
          secondary: "#3b82f6",
          accent: "#60a5fa",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    defaultTheme: "loure",
  },
} as Config;

export default config;