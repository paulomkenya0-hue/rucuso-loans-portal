/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        maroon: {
          50: "#fbf3f2",
          100: "#f4e0de",
          200: "#e6b9b5",
          300: "#d38b84",
          400: "#bd5f56",
          500: "#a3453b",
          600: "#86342c",
          700: "#6d2823", // primary
          800: "#5a2320",
          900: "#4b1f1d",
          950: "#280f0d",
        },
        gold: {
          50: "#fdf9ed",
          100: "#f9edc7",
          200: "#f3da8c",
          300: "#edc251",
          400: "#e6ab2b",
          500: "#d3901c",
          600: "#b06f16",
          700: "#8c5216",
          800: "#734218",
          900: "#623819",
        },
        ink: {
          50: "#f5f6f7",
          100: "#e7e9ec",
          200: "#cbd0d6",
          300: "#a2aab5",
          400: "#71798a",
          500: "#545c6e",
          600: "#42485a",
          700: "#363b49",
          800: "#2b2f3a",
          900: "#1c1e26",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,30,38,0.06), 0 4px 16px rgba(28,30,38,0.06)",
      },
    },
  },
  plugins: [],
};
