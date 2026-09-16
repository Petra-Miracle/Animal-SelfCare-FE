import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        page: "#F7FAF9",
        surface: "#FFFFFF",
        subtle: "#F0F5F4",
        border: "#DFE7E5",
        primary: {
          DEFAULT: "#0F766E",
          hover: "#0B5C56",
          light: "#E4F3F1",
        },
        accent: "#14B8A6",
        emergency: {
          DEFAULT: "#DC2626",
          bg: "#FEECEC",
        },
        warning: {
          DEFAULT: "#B45309",
          bg: "#FEF3C7",
        },
        success: {
          DEFAULT: "#15803D",
          bg: "#DCFCE7",
        },
        info: {
          DEFAULT: "#1D4ED8",
          bg: "#DBEAFE",
        },
        txt: {
          primary: "#12211F",
          secondary: "#57706B",
          muted: "#93A6A2",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(28 25 23 / 0.05), 0 8px 24px -12px rgb(5 150 105 / 0.25)",
        lift: "0 2px 4px rgb(28 25 23 / 0.06), 0 16px 40px -16px rgb(5 150 105 / 0.35)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        radius: {
          small: "8px",
          medium: "12px",
          large: "16px",
        },
        borderWidth: {
          small: "1px",
          medium: "1px",
          large: "2px",
        },
      },
      themes: {
        light: {
          colors: {
            brand: {
              50: "#E4F3F1",
              100: "#C8E8E3",
              200: "#91D1C8",
              300: "#5ABAAD",
              400: "#2EA397",
              500: "#0F766E",
              600: "#0B5C56",
              700: "#084A44",
              800: "#053832",
              900: "#032620",
              DEFAULT: "#0F766E",
              foreground: "#ffffff",
            },
          } as never,
        },
      },
    }) as unknown as never,
  ],
};
export default config;
