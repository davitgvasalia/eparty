"use client";

import Link from "next/link";
import { totalVotes } from "@/lib/model";
import type { Dict } from "@/lib/dictionaries";
import { fmtDate, type Locale } from "@/lib/i18n";
import PollCard from "./PollCard";
import { useFinishedPolls, useOpenPolls } from "./PollsStore";
import ResultBars from "./ResultBars";

export function PollList({ locale, dict }: { locale: Locale; dict: Dict }) {
  const polls = useOpenPolls();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {polls.map((p) => (
        <PollCard key={p.id} poll={p} locale={locale} dict={dict} />
      ))}
    </div>
  );
}

export function PollSummaryList({ locale, dict }: { locale: Locale; dict: Dict }) {
  const polls = useOpenPolls();

  return (
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
  );
}

export function FinishedPollList({ locale, dict }: { locale: Locale; dict: Dict }) {
  const polls = useFinishedPolls();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {polls.map((p) => (
        <div key={p.id} className="card p-5">
          {p.image && (
            <img src={p.image} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />
          )}
          <h3 className="font-semibold">{p.title[locale]}</h3>
          <p className="mb-4 mt-1 text-xs text-slate-500">
            {dict.common.endedOn}: {fmtDate(p.closedAt ?? p.endsAt, locale)} · {dict.results.turnout}:{" "}
            {totalVotes(p)}
          </p>
          <ResultBars poll={p} locale={locale} highlightWinner />
        </div>
      ))}
    </div>
  );
}

export function OpenPollCount() {
  return <>{useOpenPolls().length}</>;
}

export function FinishedPollCount() {
  return <>{useFinishedPolls().length}</>;
}
