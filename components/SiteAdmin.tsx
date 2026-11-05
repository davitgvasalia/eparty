"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, ExternalLink, Lock, Plus, Save, Smartphone, Trash2 } from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { blank, defaultSite, type SiteContent, type SiteData } from "@/lib/siteContent";
import AdminNews from "./AdminNews";
import { api, useSession } from "./PollsStore";
import WalletButton from "./WalletButton";

type Path = (string | number)[];
type Tab = "slides" | "about" | "statute" | "membership" | "news" | "contacts" | "general";
type L = Record<Locale, string>;

const TABS: Tab[] = ["slides", "about", "statute", "membership", "news", "contacts", "general"];

/** Which parts of the texts each tab edits. */
const TAB_KEYS: Record<Tab, (keyof SiteContent)[]> = {
  slides: ["slides"],
  about: ["about"],
  statute: ["statute"],
  membership: ["membership"],
  news: ["news"],
  contacts: ["contacts"],
  general: ["nav", "openApp", "footer"],
};

const UI = {
  title: { ka: "ვებგვერდის მართვა", en: "Website management" },
  subtitle: {
    ka: "სლაიდები, გვერდების ტექსტები, სიახლეები და კონტაქტი. ცვლილებები საიტზე შენახვისთანავე ჩანს.",
    en: "Slides, page texts, news and contacts. Changes appear on the website as soon as they are saved.",
  },
  tabs: {
    slides: { ka: "სლაიდები", en: "Slides" },
    about: { ka: "პარტიის შესახებ", en: "About" },
    statute: { ka: "წესდება", en: "Statute" },
    membership: { ka: "გაწევრიანება", en: "Membership" },
    news: { ka: "სიახლეები", en: "News" },
    contacts: { ka: "კონტაქტი", en: "Contacts" },
    general: { ka: "მენიუ და ღილაკები", en: "Menu and buttons" },
  },
  save: { ka: "შენახვა", en: "Save" },
  saved: { ka: "შენახულია", en: "Saved" },
  unsaved: { ka: "შეუნახავი ცვლილებები", en: "Unsaved changes" },
  add: { ka: "დამატება", en: "Add" },
  up: { ka: "ზემოთ", en: "Move up" },
  down: { ka: "ქვემოთ", en: "Move down" },
  remove: { ka: "წაშლა", en: "Remove" },
  viewSite: { ka: "საიტის ნახვა", en: "View website" },
  restricted: {
    ka: "ეს გვერდი მხოლოდ ადმინისტრატორისთვისაა. დააკავშირეთ ადმინისტრატორის ვოლეტი და მოაწერეთ ხელი.",
    en: "This page is for the administrator only. Connect the administrator wallet and sign in.",
  },
  notAdmin: {
    ka: "ეს ვოლეტი ადმინისტრატორის არ არის.",
    en: "This wallet is not the administrator's.",
  },
  webOnly: {
    ka: "ვებგვერდის მართვა მხოლოდ ბრაუზერიდან არის ხელმისაწვდომი. გახსენით e-p.hrgeo.ge/ka/site/admin კომპიუტერში.",
    en: "Website management is only available in a browser. Open e-p.hrgeo.ge/en/site/admin on a computer.",
  },
  leave: { ka: "შენახვის გარეშე გასვლა?", en: "Leave without saving?" },
  contactValues: { ka: "საკონტაქტო მონაცემები", en: "Contact details" },
  contactHint: {
    ka: "ცარიელი ველი საიტზე არ გამოჩნდება.",
    en: "Empty fields are not shown on the website.",
  },
  sectionTexts: { ka: "სექციის ტექსტები", en: "Section texts" },
  item: { ka: "ელემენტი", en: "Item" },
} satisfies Record<string, L | Record<string, L>>;

/** Field names in the texts, shown as labels. */
const LABELS: Record<string, L> = {
  nav: { ka: "მენიუს პუნქტები", en: "Menu items" },
  openApp: { ka: "ღილაკი „აპლიკაციის გახსნა“", en: "“Open the app” button" },
  footer: { ka: "ქვედა ზოლის წარწერა", en: "Footer text" },
  slides: { ka: "სლაიდები", en: "Slides" },
  about: { ka: "პარტიის შესახებ", en: "About" },
  statute: { ka: "წესდება", en: "Statute" },
  membership: { ka: "გაწევრიანება", en: "Membership" },
  news: { ka: "სიახლეები", en: "News" },
  contacts: { ka: "კონტაქტი", en: "Contacts" },
  title: { ka: "სათაური", en: "Title" },
  subtitle: { ka: "ქვესათაური", en: "Subtitle" },
  text: { ka: "ტექსტი", en: "Text" },
  paragraphs: { ka: "აბზაცები", en: "Paragraphs" },
  points: { ka: "ბარათები გვერდით", en: "Cards beside the text" },
  articles: { ka: "მუხლები", en: "Articles" },
  steps: { ka: "ნაბიჯები", en: "Steps" },
  requirements: { ka: "მოთხოვნები", en: "Requirements" },
  items: { ka: "პუნქტები", en: "Points" },
  apply: { ka: "განაცხადის ღილაკი", en: "Application button" },
  empty: { ka: "ტექსტი, როცა სიახლე არ არის", en: "Text when there is no news" },
  email: { ka: "ელ-ფოსტა", en: "Email" },
  phone: { ka: "ტელეფონი", en: "Phone" },
  address: { ka: "მისამართი", en: "Address" },
  facebook: { ka: "Facebook", en: "Facebook" },
  website: { ka: "ვებგვერდი", en: "Website" },
};

const getAt = (obj: unknown, path: Path): unknown =>
  path.reduce<unknown>((o, k) => (o as Record<string | number, unknown>)?.[k], obj);

function setAt<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [k, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string | number, unknown>;
  copy[k] = setAt(copy[k], rest, value);
  return copy as T;
}

function isAppMode() {
  const m = (q: string) => window.matchMedia?.(q).matches;
  return (
    m("(display-mode: standalone)") ||
    m("(display-mode: fullscreen)") ||
    m("(display-mode: minimal-ui)") ||
    /\bEPartyApp\b/.test(navigator.userAgent) ||
    !!(window as unknown as { Capacitor?: unknown }).Capacitor
  );
}

export default function SiteAdmin({ locale, dict }: { locale: Locale; dict: Dict }) {
  const { wallet, signedIn, isAdmin, signIn, signingIn } = useSession();
  const [inApp, setInApp] = useState(false);
  const [tab, setTab] = useState<Tab>("slides");
  const [data, setData] = useState<SiteData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState("");
  const t = (l: L) => l[locale];

  useEffect(() => setInApp(isAppMode()), []);

  const load = useCallback(async () => {
    try {
      setData(await api<SiteData>("/api/admin/site"));
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (path: Path, value: unknown) => {
    setData((d) => (d ? setAt(d, path, value) : d));
    setDirty(true);
    setSavedAt(false);
  };

  /** Applies the same list change to both languages, so their items stay paired. */
  const changeList = (path: Path, fn: (list: unknown[]) => unknown[]) => {
    setData((d) => {
      if (!d) return d;
      let next = d;
      for (const l of ["ka", "en"] as const) next = setAt(next, [l, ...path], fn(getAt(next, [l, ...path]) as unknown[]));
      return next;
    });
    setDirty(true);
    setSavedAt(false);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      setData(await api<SiteData>("/api/admin/site", { method: "PUT", body: data }));
      setDirty(false);
      setSavedAt(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ---- generic editor: walks the English texts and edits both languages at the same path ----

  const label = (key: string | number) =>
    typeof key === "number" ? `${t(UI.item)} ${key + 1}` : LABELS[key] ? t(LABELS[key]) : key;

  const renderText = (path: Path, key: string | number) => {
    const en = String(getAt(data!.en, path) ?? "");
    const ka = String(getAt(data!.ka, path) ?? "");
    const long = Math.max(en.length, ka.length) > 70 || key === "text" || key === "subtitle";
    const field = (l: Locale, value: string) =>
      long ? (
        <textarea
          className="input min-h-[88px]"
          value={value}
          onChange={(e) => change([l, ...path], e.target.value)}
          aria-label={`${label(key)} (${l})`}
        />
      ) : (
        <input className="input" value={value} onChange={(e) => change([l, ...path], e.target.value)} aria-label={`${label(key)} (${l})`} />
      );
    return (
      <div key={path.join(".")}>
        {typeof key === "string" && <div className="mb-1 text-xs font-medium text-slate-500">{label(key)}</div>}
        <div className="grid gap-2 md:grid-cols-2">
          {field("ka", ka)}
          {field("en", en)}
        </div>
      </div>
    );
  };

  const renderList = (path: Path, key: string) => {
    const list = getAt(data!.en, path) as unknown[];
    // The default texts give the shape of a new item (e.g. a slide has a title and a text).
    const template = blank((getAt(defaultSite.en, path) as unknown[] | undefined)?.[0] ?? "");
    const move = (i: number, d: number) =>
      changeList(path, (l) => {
        const c = [...l];
        [c[i], c[i + d]] = [c[i + d], c[i]];
        return c;
      });
    return (
      <div key={path.join(".")}>
        <div className="mb-2 text-sm font-semibold">{label(key)}</div>
        <div className="space-y-3">
          {list.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">#{i + 1}</span>
                <div className="flex gap-1">
                  <button className="btn btn-ghost !px-2 !py-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t(UI.up)} title={t(UI.up)}>
                    <ArrowUp size={14} />
                  </button>
                  <button className="btn btn-ghost !px-2 !py-1" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={t(UI.down)} title={t(UI.down)}>
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="btn btn-ghost !px-2 !py-1 text-rose-700"
                    onClick={() => changeList(path, (l) => l.filter((_, j) => j !== i))}
                    aria-label={t(UI.remove)}
                    title={t(UI.remove)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">{renderNode([...path, i], i, item)}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost mt-3" onClick={() => changeList(path, (l) => [...l, structuredClone(template)])}>
          <Plus size={16} /> {t(UI.add)}
        </button>
      </div>
    );
  };

  function renderNode(path: Path, key: string | number, value: unknown): React.ReactNode {
    if (typeof value === "string") return renderText(path, key);
    if (Array.isArray(value)) return renderList(path, String(key));
    if (value && typeof value === "object") {
      const children = Object.entries(value).map(([k, v]) => renderNode([...path, k], k, v));
      if (typeof key === "number") return children;
      return (
        <fieldset key={path.join(".")} className="space-y-4">
          {path.length > 1 && <legend className="mb-2 text-sm font-semibold">{label(key)}</legend>}
          {children}
        </fieldset>
      );
    }
    return null;
  }

  // ---- screens ----

  const header = (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1a33] pt-safe">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
        <Link href={`/${locale}/site`} className="flex min-w-0 items-center gap-3">
          <img src="/icons/logo-e3d-green-on-navy.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
          <span className="truncate font-semibold text-white">{t(UI.title)}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/${locale === "ka" ? "en" : "ka"}/site/admin`}
            className="rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            {locale === "ka" ? "EN" : "ქარ"}
          </Link>
          <Link
            href={`/${locale}/site`}
            target="_blank"
            className="hidden items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 sm:inline-flex"
          >
            <ExternalLink size={16} /> {t(UI.viewSite)}
          </Link>
          {!inApp && <WalletButton />}
        </div>
      </div>
    </header>
  );

  const card = (children: React.ReactNode) => (
    <div className="card mx-auto mt-16 max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {inApp ? <Smartphone size={22} /> : <Lock size={22} />}
      </div>
      {children}
    </div>
  );

  let body: React.ReactNode;
  if (inApp) {
    body = card(<p className="text-sm text-slate-600">{t(UI.webOnly)}</p>);
  } else if (!isAdmin) {
    body = card(
      <>
        <p className="text-sm text-slate-600">{signedIn ? t(UI.notAdmin) : t(UI.restricted)}</p>
        <div className="mt-5 flex justify-center">
          {!wallet ? (
            <WalletButton />
          ) : (
            !signedIn && (
              <button className="btn btn-primary" disabled={signingIn} onClick={signIn}>
                {dict.common.signIn}
              </button>
            )
          )}
        </div>
      </>
    );
  } else if (!data) {
    body = <p className="mt-16 text-center text-sm text-slate-500">{error || "…"}</p>;
  } else {
    body = (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t(UI.title)}</h1>
          <p className="mt-1 text-sm text-slate-500">{t(UI.subtitle)}</p>
        </div>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {TABS.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === x ? "bg-surface shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t(UI.tabs[x])}
            </button>
          ))}
        </div>

        <div className="mb-3 hidden grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
          <span>ქართული</span>
          <span>English</span>
        </div>

        <div className="space-y-6">
          {tab === "news" && (
            <section className="card p-5">
              <AdminNews locale={locale} dict={dict} />
            </section>
          )}

          {tab === "contacts" && (
            <section className="card space-y-4 p-5">
              <div>
                <h2 className="font-semibold">{t(UI.contactValues)}</h2>
                <p className="mt-1 text-xs text-slate-500">{t(UI.contactHint)}</p>
              </div>
              {(["email", "phone", "facebook", "website"] as const).map((k) => (
                <label key={k} className="block text-xs font-medium text-slate-500">
                  {label(k)}
                  <input
                    className="input mt-1 md:max-w-md"
                    value={data.contacts[k]}
                    type={k === "email" ? "email" : k === "phone" ? "tel" : k === "facebook" || k === "website" ? "url" : "text"}
                    placeholder={k === "facebook" || k === "website" ? "https://" : undefined}
                    onChange={(e) => change(["contacts", k], e.target.value)}
                  />
                </label>
              ))}
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">{label("address")}</div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(["ka", "en"] as const).map((l) => (
                    <input
                      key={l}
                      className="input"
                      value={data.contacts.address[l]}
                      onChange={(e) => change(["contacts", "address", l], e.target.value)}
                      aria-label={`${label("address")} (${l})`}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="card space-y-6 p-5">
            {(tab === "news" || tab === "contacts") && <h2 className="font-semibold">{t(UI.sectionTexts)}</h2>}
            {TAB_KEYS[tab].map((k) => renderNode([k], k, data.en[k]))}
          </section>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-slate-200 bg-surface/95 px-4 py-3 pb-safe backdrop-blur md:-mx-8 md:px-8">
          <div className="flex items-center justify-end gap-3">
            {error && <span className="mr-auto text-sm text-rose-700">{error}</span>}
            {dirty ? (
              <span className="text-sm text-amber-700">{t(UI.unsaved)}</span>
            ) : (
              savedAt && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                  <Check size={16} /> {t(UI.saved)}
                </span>
              )
            )}
            <button className="btn btn-primary" disabled={!dirty || saving} onClick={save}>
              <Save size={16} /> {t(UI.save)}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {header}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{body}</main>
    </div>
  );
}

