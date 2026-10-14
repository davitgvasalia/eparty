import type { Config } from "tailwindcss";

// Colors backed by CSS variables (see app/globals.css). Their values flip
// under `.dark`, so existing classes like `bg-slate-50` adapt to the theme
// without needing a `dark:` variant on every element.
const themed = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const shades = (color: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, themed(`${color}-${s}`)]));

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: themed("surface"),
        slate: shades("slate", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        indigo: shades("indigo", [50, 700]),
        amber: shades("amber", [50, 200, 700, 800]),
        emerald: shades("emerald", [50, 700]),
        rose: shades("rose", [50, 700]),
      },
    },
  },
  plugins: [],
};

export default config;
