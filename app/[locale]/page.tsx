import Link from "next/link";
import { Users, Vote, Lightbulb, CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale, fmtDate } from "@/lib/i18n";
import { members, polls, finishedPolls, initiatives, totalVotes } from "@/lib/demo-data";
import { PageHeader, StatCard, StatusBadge, Notice } from "@/components/ui";

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.home.welcome} subtitle={dict.tagline} />
      <Notice>{dict.common.demoNotice}</Notice>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.home.stats.members} value={members.length} icon={<Users size={20} />} />
        <StatCard label={dict.home.stats.activePolls} value={polls.length} icon={<Vote size={20} />} />
        <StatCard label={dict.home.stats.initiatives} value={initiatives.length} icon={<Lightbulb size={20} />} />
        <StatCard label={dict.home.stats.completed} value={finishedPolls.length} icon={<CircleCheck size={20} />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{dict.home.latestPolls}</h2>
            <Link href={`/${locale}/polls`} className="text-sm text-indigo-600 hover:underline">
              {dict.home.viewAll}
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {polls.map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/${locale}/polls`} className="block hover:text-indigo-700">
                  <div className="text-sm font-medium">{p.title[locale]}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {dict.common.endsOn}: {fmtDate(p.endsAt, locale)} · {totalVotes(p)} {dict.common.votes}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{dict.home.latestInitiatives}</h2>
            <Link href={`/${locale}/initiatives`} className="text-sm text-indigo-600 hover:underline">
              {dict.home.viewAll}
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {initiatives.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium">{i.title[locale]}</span>
                <StatusBadge status={i.status} label={dict.initiatives.status[i.status]} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
