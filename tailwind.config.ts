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
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(28 25 23 / 0.05), 0 8px 24px -12px rgb(5 150 105 / 0.25)",
        lift: "0 2px 4px rgb(28 25 23 / 0.06), 0 16px 40px -16px rgb(5 150 105 / 0.35)",
      },
    },
  },
  darkMode: "class",
  // Cast: duplikat tipe tailwindcss di node_modules membuat checker bawel,
  // plugin tetap valid untuk Tailwind v3 saat runtime.
  plugins: [
    heroui({
      layout: {
        radius: {
          small: "0.5rem",
          medium: "0.75rem",
          large: "1.25rem",
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
            // `as never`: ThemeColors bawaan tidak mengenal kunci custom,
            // tapi plugin runtime mendukung warna tambahan seperti ini.
            brand: {
              50: "#ecfdf3",
              100: "#d1fae0",
              200: "#a6f4c5",
              300: "#6ce9a6",
              400: "#32d583",
              500: "#12b76a",
              600: "#039855",
              700: "#027a48",
              800: "#05603a",
              900: "#054f31",
              DEFAULT: "#039855",
              foreground: "#ffffff",
            },
          } as never,
        },
      },
    }) as unknown as never,
  ],
};
export default config;
