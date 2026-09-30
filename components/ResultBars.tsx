import type { Poll } from "@/lib/demo-data";
import { totalVotes } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n";

export default function ResultBars({
  poll,
  locale,
  highlightWinner = false,
}: {
  poll: Poll;
  locale: Locale;
  highlightWinner?: boolean;
}) {
  const total = totalVotes(poll) || 1;
  const max = Math.max(...poll.options.map((o) => o.votes));

  return (
    <div className="space-y-3">
      {poll.options.map((o) => {
        const pct = Math.round((o.votes / total) * 100);
        const isWinner = highlightWinner && o.votes === max;
        return (
          <div key={o.id}>
            <div className="mb-1 flex justify-between text-sm">
              <span className={isWinner ? "font-semibold" : ""}>
                {o.label[locale]}
              </span>
              <span className="text-slate-500">
                {o.votes} · {pct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  isWinner ? "bg-emerald-500" : "bg-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
