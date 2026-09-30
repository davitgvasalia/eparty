"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Poll } from "@/lib/demo-data";
import { totalVotes } from "@/lib/demo-data";
import { fmtDate, type Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/dictionaries";
import ResultBars from "./ResultBars";

export default function PollCard({
  poll,
  locale,
  dict,
}: {
  poll: Poll;
  locale: Locale;
  dict: Dict;
}) {
  const { connected } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold">{poll.title[locale]}</h3>
      <p className="mt-1 text-xs text-slate-500">
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
                className="accent-indigo-600"
              />
              {o.label[locale]}
            </label>
          ))}

          <div className="flex items-center justify-between gap-3 pt-2">
            {!connected && (
              <span className="text-xs text-slate-500">
                {dict.common.connectToVote}
              </span>
            )}
            <button
              className="btn btn-primary ml-auto"
              disabled={!connected || !selected}
              onClick={() => setVoted(true)}
            >
              {dict.common.vote}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
