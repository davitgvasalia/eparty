"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Vote,
  Lightbulb,
  CircleCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import ThemeToggle from "./ThemeToggle";
import WalletButton from "./WalletButton";

const ITEMS = [
  { key: "home", href: "/", icon: LayoutDashboard },
  { key: "members", href: "/members", icon: Users },
  { key: "polls", href: "/polls", icon: Vote },
  { key: "initiatives", href: "/initiatives", icon: Lightbulb },
  { key: "results", href: "/results", icon: CircleCheck },
  { key: "apply", href: "/apply", icon: UserPlus },
  { key: "admin", href: "/admin", icon: ShieldCheck },
] as const;

export default function Shell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: ReactNode;
}) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/(ka|en)/, "") || "/";
  const isActive = (href: string) =>
    href === "/" ? rest === "/" : rest.startsWith(href);
  const other: Locale = locale === "ka" ? "en" : "ka";
  const switchHref = pathname.replace(/^\/(ka|en)/, `/${other}`);

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-surface md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Vote size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{dict.appName}</div>
            <div className="text-[11px] text-slate-500">Solana</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {ITEMS.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={`/${locale}${href === "/" ? "" : href}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {dict.nav[key]}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          {dict.tagline}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur md:px-8">
          <span className="text-sm font-semibold md:hidden">{dict.appName}</span>
          <span className="hidden text-sm text-slate-500 md:block">
            {dict.tagline}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={switchHref}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Switch language"
            >
              {locale === "ka" ? "EN" : "ქარ"}
            </Link>
            <ThemeToggle label={dict.common.toggleTheme} />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-mobile-nav md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-slate-200 bg-surface pb-safe md:hidden">
        {ITEMS.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={`/${locale}${href === "/" ? "" : href}`}
            className={`flex flex-col items-center gap-1 py-3 text-[11px] ${
              isActive(href) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
            }`}
          >
            <Icon size={22} />
            <span className="max-w-full truncate px-0.5">{dict.nav[key]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
