"use client";

import { useState } from "react";
import { Plus, ThumbsUp } from "lucide-react";
import {
  INITIATIVE_THRESHOLD,
  draftLikesNeeded,
  initiativeDeadline,
  isDraft,
  type Initiative,
  type InitiativeVote,
} from "@/lib/model";
import type { Dict } from "@/lib/dictionaries";
import { fmtDate, type Locale } from "@/lib/i18n";
import { useInitiatives, useMembers, useSession, useStore } from "./PollsStore";
import SignInHint from "./SignInHint";
import { StatusBadge } from "./ui";

function InitiativeBadge({ initiative, dict }: { initiative: Initiative; dict: Dict }) {
  return isDraft(initiative) && initiative.status === "pending" ? (
    <StatusBadge status="draft" label={dict.initiatives.draft} />
  ) : (
    <StatusBadge status={initiative.status} label={dict.initiatives.status[initiative.status]} />
  );
}

function Progress({ left, right, pct }: { left: string; right: string; pct: number }) {
  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function InitiativeCard({
  initiative,
  locale,
  dict,
}: {
  initiative: Initiative;
  locale: Locale;
  dict: Dict;
}) {
  const members = useMembers();
  const { run } = useStore();
  const { member } = useSession();
  const [busy, setBusy] = useState(false);

  const draft = isDraft(initiative);
  const pending = initiative.status === "pending";
  const author = members.find((m) => m.id === initiative.authorId);
  const deadline = initiativeDeadline(initiative);
  // With few members one like is enough to promote a draft, so authors can't like their own.
  const isAuthor = !!member && member.id === initiative.authorId;

  const pct = members.length ? Math.round((initiative.yes / members.length) * 100) : 0;
  const likesNeeded = draftLikesNeeded(members.length);

  const act = async (path: string, body: unknown = {}) => {
    setBusy(true);
    await run(path, { body });
    setBusy(false);
  };

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{initiative.title[locale]}</h3>
        <InitiativeBadge initiative={initiative} dict={dict} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{initiative.summary[locale]}</p>
      <p className="mt-4 text-xs text-slate-500">
        {dict.initiatives.author}: {author?.name[locale] ?? "-"}
        {deadline && ` · ${dict.initiatives.deadline}: ${fmtDate(deadline, locale)}`}
      </p>

      {draft ? (
        <>
          <Progress
            left={`${dict.initiatives.likes}: ${initiative.likes} / ${likesNeeded}`}
            right={`${dict.initiatives.needed} ${likesNeeded}`}
            pct={Math.round((initiative.likes / likesNeeded) * 100)}
          />
          {pending && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              {initiative.myLike ? (
                <p className="text-sm text-emerald-700">{dict.initiatives.liked}</p>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={!member || isAuthor || busy}
                    onClick={() => act(`/api/initiatives/${initiative.id}/like`)}
                  >
                    <ThumbsUp size={16} /> {dict.initiatives.like}
                  </button>
                  <SignInHint dict={dict} membersOnly={dict.common.membersOnly} />
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <Progress
            left={`${dict.initiatives.inFavor}: ${initiative.yes} / ${members.length}`}
            right={`${pct}% · ${dict.initiatives.needed} ${Math.round(INITIATIVE_THRESHOLD * 100)}%`}
            pct={pct}
          />
          {pending && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="text-sm font-medium">{dict.initiatives.question}</div>
              {initiative.myVote ? (
                <p className="mt-2 text-sm text-emerald-700">
                  {dict.initiatives.yourVote}: {dict.initiatives[initiative.myVote]}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(["yes", "no"] as InitiativeVote[]).map((choice) => (
                    <button
                      key={choice}
                      className={`btn ${choice === "yes" ? "btn-primary" : "btn-ghost"}`}
                      disabled={!member || busy}
                      onClick={() => act(`/api/initiatives/${initiative.id}/vote`, { choice })}
                    >
                      {dict.initiatives[choice]}
                    </button>
                  ))}
                  <SignInHint dict={dict} membersOnly={dict.common.membersOnly} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function InitiativeList({ locale, dict }: { locale: Locale; dict: Dict }) {
  const initiatives = useInitiatives();
  const { run } = useStore();
  const { member } = useSession();

  const [tab, setTab] = useState<"drafts" | "initiatives">("drafts");
  const [formOpen, setFormOpen] = useState(false);
  const [titleKa, setTitleKa] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [summaryKa, setSummaryKa] = useState("");
  const [summaryEn, setSummaryEn] = useState("");

  const resetForm = () => {
    setTitleKa("");
    setTitleEn("");
    setSummaryKa("");
    setSummaryEn("");
    setFormOpen(false);
  };

  const addInitiative = async () => {
    if (!member) return;
    if (!titleKa.trim() || !titleEn.trim() || !summaryKa.trim() || !summaryEn.trim()) return;
    const ok = await run("/api/initiatives", { body: { titleKa, titleEn, summaryKa, summaryEn } });
    if (ok) {
      resetForm();
      setTab("drafts");
    }
  };

  return (
    <div className="space-y-6">
      {formOpen ? (
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">{dict.initiatives.add}</h3>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder={dict.initiatives.titleKa} value={titleKa} onChange={(e) => setTitleKa(e.target.value)} />
              <input className="input" placeholder={dict.initiatives.titleEn} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
              <textarea className="input min-h-[96px]" placeholder={dict.initiatives.summaryKa} value={summaryKa} onChange={(e) => setSummaryKa(e.target.value)} />
              <textarea className="input min-h-[96px]" placeholder={dict.initiatives.summaryEn} value={summaryEn} onChange={(e) => setSummaryEn(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={resetForm}>
                {dict.admin.cancel}
              </button>
              <button className="btn btn-primary" onClick={addInitiative}>
                {dict.admin.add}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={!member} onClick={() => setFormOpen(true)}>
            <Plus size={16} /> {dict.initiatives.add}
          </button>
          <SignInHint dict={dict} membersOnly={dict.initiatives.membersOnly} />
        </div>
      )}

      <div>
        <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
          {(["drafts", "initiatives"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t ? "bg-surface shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {dict.initiatives.tabs[t]} ({initiatives.filter((i) => isDraft(i) === (t === "drafts")).length})
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          {tab === "drafts" ? dict.initiatives.draftsSubtitle : dict.initiatives.subtitle}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {initiatives
          .filter((i) => isDraft(i) === (tab === "drafts"))
          .map((i) => (
            <InitiativeCard key={i.id} initiative={i} locale={locale} dict={dict} />
          ))}
      </div>
    </div>
  );
}

export function InitiativeSummaryList({ locale, dict }: { locale: Locale; dict: Dict }) {
  const initiatives = useInitiatives();

  return (
    <ul className="divide-y divide-slate-100">
      {initiatives.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 py-3">
          <span className="text-sm font-medium">{i.title[locale]}</span>
          <InitiativeBadge initiative={i} dict={dict} />
        </li>
      ))}
    </ul>
  );
}

export function InitiativeCount() {
  return <>{useInitiatives().length}</>;
}
