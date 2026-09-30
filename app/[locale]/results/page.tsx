import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale, fmtDate } from "@/lib/i18n";
import { finishedPolls, totalVotes } from "@/lib/demo-data";
import { PageHeader, Notice } from "@/components/ui";
import ResultBars from "@/components/ResultBars";

export default function ResultsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.results.title} subtitle={dict.results.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <div className="grid gap-5 lg:grid-cols-2">
        {finishedPolls.map((p) => (
          <div key={p.id} className="card p-5">
            <h3 className="font-semibold">{p.title[locale]}</h3>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              {dict.common.endedOn}: {fmtDate(p.endsAt, locale)} · {dict.results.turnout}:{" "}
              {totalVotes(p)}
            </p>
            <ResultBars poll={p} locale={locale} highlightWinner />
          </div>
        ))}
      </div>
    </>
  );
}
