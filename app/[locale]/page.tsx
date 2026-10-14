import Link from "next/link";
import { Users, Vote, Lightbulb, CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, StatCard, Notice } from "@/components/ui";
import { InitiativeCount, InitiativeSummaryList } from "@/components/InitiativeViews";
import { MemberCount } from "@/components/MemberViews";
import { FinishedPollCount, OpenPollCount, PollSummaryList } from "@/components/PollViews";

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.home.welcome} subtitle={dict.tagline} />
      <Notice>{dict.common.demoNotice}</Notice>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.home.stats.members} value={<MemberCount />} icon={<Users size={20} />} />
        <StatCard label={dict.home.stats.activePolls} value={<OpenPollCount />} icon={<Vote size={20} />} />
        <StatCard label={dict.home.stats.initiatives} value={<InitiativeCount />} icon={<Lightbulb size={20} />} />
        <StatCard label={dict.home.stats.completed} value={<FinishedPollCount />} icon={<CircleCheck size={20} />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{dict.home.latestPolls}</h2>
            <Link href={`/${locale}/polls`} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
              {dict.home.viewAll}
            </Link>
          </div>
          <PollSummaryList locale={locale} dict={dict} />
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{dict.home.latestInitiatives}</h2>
            <Link href={`/${locale}/initiatives`} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
              {dict.home.viewAll}
            </Link>
          </div>
          <InitiativeSummaryList locale={locale} dict={dict} />
        </section>
      </div>
    </>
  );
}
