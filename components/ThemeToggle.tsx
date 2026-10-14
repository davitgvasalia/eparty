"use client";

import { Moon, Sun } from "lucide-react";

// Runs in <head> before first paint so the saved (or system) theme is applied
// without a flash of the wrong one.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  };

  // Both icons are rendered and CSS picks one, so the markup is identical on
  // server and client regardless of the active theme.
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50"
      aria-label={label}
      title={label}
    >
      <Moon size={18} className="dark:hidden" />
      <Sun size={18} className="hidden dark:block" />
    </button>
  );
}
