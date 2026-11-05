import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  Facebook,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import SiteSlider from "@/components/SiteSlider";
import { getDict } from "@/lib/dictionaries";
import { fmtDate, isLocale } from "@/lib/i18n";
import { listNews, type NewsItem } from "@/lib/server/news";
import { appRedirectScript } from "@/lib/appMode";
import { contacts, getSiteContent } from "@/lib/siteContent";

// News comes from the database on every visit.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const dict = getDict(params.locale);
  return { title: `${dict.appName} · ${dict.tagline}`, description: dict.tagline };
}

const POINT_ICONS = [Eye, Users, ShieldCheck];

export default async function SitePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);
  const c = getSiteContent(locale);
  const appHref = `/${locale}`;
  const other = locale === "ka" ? "en" : "ka";

  // The site should still open if the database is unreachable; the timeline is then empty.
  let news: NewsItem[] = [];
  try {
    news = await listNews();
  } catch (e) {
    console.error(e);
  }

  const sections = ["about", "statute", "membership", "news", "contacts"] as const;
  const contactRows = [
    contacts.email && { icon: Mail, label: c.contacts.email, value: contacts.email, href: `mailto:${contacts.email}` },
    contacts.phone && { icon: Phone, label: c.contacts.phone, value: contacts.phone, href: `tel:${contacts.phone.replace(/\s/g, "")}` },
    contacts.address[locale] && { icon: MapPin, label: c.contacts.address, value: contacts.address[locale] },
    contacts.facebook && { icon: Facebook, label: c.contacts.facebook, value: "Facebook", href: contacts.facebook },
    contacts.website && { icon: Globe, label: c.contacts.website, value: contacts.website.replace(/^https?:\/\//, ""), href: contacts.website },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script dangerouslySetInnerHTML={{ __html: appRedirectScript(appHref) }} />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1a33]/90 pt-safe backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <img src="/icons/logo-e3d-green-on-navy.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
            <span className="truncate font-semibold text-white">{dict.appName}</span>
          </a>
          <nav className="hidden items-center gap-1 xl:flex">
            {sections.map((s) => (
              <a key={s} href={`#${s}`} className="rounded-lg px-3 py-2 text-sm text-[#c4daff] transition hover:bg-white/10 hover:text-white">
                {c.nav[s]}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${other}/site`}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              aria-label="Switch language"
            >
              {locale === "ka" ? "EN" : "ქარ"}
            </Link>
            <Link
              href={appHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4fe0a8] px-3 py-2 text-sm font-semibold text-[#0b1a33] transition hover:bg-[#7cebbb] sm:px-4"
            >
              <Smartphone size={16} />
              <span className="hidden sm:inline">{c.openApp}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with slides */}
      <section id="top" className="relative overflow-hidden bg-[#0b1a33]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#4fe0a8]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-32 h-[480px] w-[480px] rounded-full bg-[#9dbfff]/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_auto] md:px-8 md:py-24">
          <SiteSlider slides={c.slides}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={appHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4fe0a8] px-5 py-3 font-semibold text-[#0b1a33] transition hover:bg-[#7cebbb]"
              >
                {c.openApp} <ArrowRight size={18} />
              </Link>
              <a
                href="#membership"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                {c.nav.membership}
              </a>
            </div>
          </SiteSlider>
          <img
            src="/icons/logo-e3d-green-on-navy.svg"
            alt={dict.appName}
            className="hidden h-72 w-72 rounded-[2.5rem] shadow-2xl shadow-black/40 md:block lg:h-80 lg:w-80"
          />
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionTitle title={c.about.title} />
          <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4 text-base leading-relaxed text-slate-600">
              {c.about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="space-y-3">
              {c.about.points.map((p, i) => {
                const Icon = POINT_ICONS[i % POINT_ICONS.length];
                return (
                  <div key={i} className="card flex gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4fe0a8]/15 text-[#14966a] dark:text-[#4fe0a8]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{p.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Statute */}
      <section id="statute" className="scroll-mt-20 border-y border-slate-200 bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <SectionTitle title={c.statute.title} subtitle={c.statute.subtitle} />
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {c.statute.articles.map((a, i) => (
              <details key={i} className="group p-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {a.title}
                  <span className="text-xl leading-none text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionTitle title={c.membership.title} subtitle={c.membership.subtitle} />
          <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
            <ol className="grid gap-4 sm:grid-cols-2">
              {c.membership.steps.map((s, i) => (
                <li key={i} className="card p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b1a33] text-sm font-bold text-[#4fe0a8]">
                    {i + 1}
                  </div>
                  <div className="mt-4 font-semibold">{s.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="card flex flex-col p-6">
              <h3 className="font-semibold">{c.membership.requirements.title}</h3>
              <ul className="mt-4 flex-1 space-y-3">
                {c.membership.requirements.items.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4fe0a8]" />
                    {r}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/apply`} className="btn btn-primary mt-6 w-full !py-3">
                {c.membership.apply} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* News timeline */}
      <section id="news" className="scroll-mt-20 border-y border-slate-200 bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <SectionTitle title={c.news.title} />
          {news.length === 0 ? (
            <p className="text-slate-500">{c.news.empty}</p>
          ) : (
            <ol className="relative space-y-10 border-l-2 border-slate-200 pl-6 sm:pl-8">
              {news.map((n) => (
                <li key={n.id} className="relative">
                  <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-surface bg-[#4fe0a8] ring-2 ring-[#4fe0a8]/30 sm:-left-[41px]" />
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={14} />
                    <time dateTime={n.date}>{fmtDate(n.date, locale)}</time>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{n.title[locale]}</h3>
                  {n.image && (
                    <img src={n.image} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" loading="lazy" />
                  )}
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{n.body[locale]}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <SectionTitle title={c.contacts.title} subtitle={c.contacts.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contactRows.map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="truncate font-medium">{value}</div>
                  </div>
                </>
              );
              return href ? (
                <a key={label} href={href} className="card flex items-center gap-4 p-5 transition hover:border-slate-300" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={label} className="card flex items-center gap-4 p-5">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1a33] pb-safe">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#c4daff] sm:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <img src="/icons/logo-e3d-green-on-navy.svg" alt="" className="h-8 w-8 rounded-lg" />
            <span>
              © {new Date().getFullYear()} {dict.appName} · {c.footer}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={appHref} className="inline-flex items-center gap-2 font-medium text-[#4fe0a8] hover:underline">
              {c.openApp} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 md:mb-10">
      <div className="mb-3 h-1 w-10 rounded-full bg-[#4fe0a8]" />
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
    </div>
  );
}
