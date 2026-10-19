"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Vote,
  Lightbulb,
  FilePen,
  CircleCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { useOpenInitiativeCount, useSession } from "./PollsStore";
import ThemeToggle from "./ThemeToggle";
import WalletButton from "./WalletButton";

const ITEMS = [
  { key: "home", href: "/", icon: LayoutDashboard },
  { key: "members", href: "/members", icon: Users },
  { key: "polls", href: "/polls", icon: Vote },
  { key: "drafts", href: "/drafts", icon: FilePen },
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

  const { member, isAdmin } = useSession();
  const counts: Partial<Record<(typeof ITEMS)[number]["key"], number>> = {
    drafts: useOpenInitiativeCount("draft"),
    initiatives: useOpenInitiativeCount("initiative"),
  };
  // Members don't need "Join" and only the admin needs "Admin"; this also keeps the
  // mobile bar to at most seven items.
  const items = ITEMS.filter(({ key }) => (key !== "apply" || !member) && (key !== "admin" || isAdmin));

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
          {items.map(({ key, href, icon: Icon }) => (
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
              <span className="flex-1">{dict.nav[key]}</span>
              {!!counts[key] && (
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {counts[key]}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          {dict.tagline}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b py-2 border-slate-200 bg-surface/80 px-4 backdrop-blur md:px-8">
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
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-surface pb-safe md:hidden">
        {items.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={`/${locale}${href === "/" ? "" : href}`}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[11px] ${
              isActive(href) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
            }`}
          >
            <span className="relative">
              <Icon size={22} />
              {!!counts[key] && (
                <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {counts[key]}
                </span>
              )}
            </span>
            <span className="max-w-full truncate px-0.5">{dict.nav[key]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
