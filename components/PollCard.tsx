"use client";

import { useState } from "react";
import type { Poll } from "@/lib/model";
import { totalVotes } from "@/lib/model";
import { fmtDate, type Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";
import { useHasStarted, useSession, useStore } from "./PollsStore";
import ResultBars from "./ResultBars";
import SignInHint from "./SignInHint";

export default function PollCard({
  poll,
  locale,
  dict,
}: {
  poll: Poll;
  locale: Locale;
  dict: Dict;
}) {
  const { run } = useStore();
  const { member } = useSession();
  const started = useHasStarted()(poll);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only party members vote: one member, one vote per poll (checked again on the server).
  const voted = !!poll.myVote;

  const castVote = async () => {
    if (!member || !selected || !started) return;
    setBusy(true);
    await run(`/api/polls/${poll.id}/vote`, { body: { optionId: selected } });
    setBusy(false);
  };

  return (
    <div className="card p-5">
      {poll.image && (
        <img src={poll.image} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />
      )}
      <h3 className="text-base font-semibold">{poll.title[locale]}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {poll.startsAt && `${dict.common.startsOn}: ${fmtDate(poll.startsAt, locale)} · `}
        {dict.common.endsOn}: {fmtDate(poll.endsAt, locale)} · {totalVotes(poll)}{" "}
        {dict.common.votes}
      </p>

      {voted ? (
        <div className="mt-4 space-y-4">
          <ResultBars poll={poll} locale={locale} />
          <p className="text-sm text-emerald-700">{dict.common.voted}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {poll.options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                selected === o.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={poll.id}
                checked={selected === o.id}
                onChange={() => setSelected(o.id)}
                disabled={!started}
                className="accent-indigo-600"
              />
              {o.label[locale]}
            </label>
          ))}

          <div className="flex items-center justify-between gap-3 pt-2">
            {!started ? (
              <span className="text-xs text-slate-500">
                {dict.common.votingOpens}: {fmtDate(poll.startsAt!, locale)}
              </span>
            ) : (
              <SignInHint dict={dict} membersOnly={dict.common.membersOnly} />
            )}
            <button
              className="btn btn-primary ml-auto"
              disabled={!member || !selected || !started || busy}
              onClick={castVote}
            >
              {dict.common.vote}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
