"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Trash2, Check, X, Lock } from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import { fmtDate, shortWallet, type Locale } from "@/lib/i18n";
import {
  members as initialMembers,
  polls as initialPolls,
  initiatives as initialInitiatives,
  type Member,
  type Poll,
  type Initiative,
} from "@/lib/demo-data";
import { Notice, StatusBadge } from "./ui";
import WalletButton from "./WalletButton";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";

type Tab = "members" | "polls" | "initiatives";

export default function AdminPanel({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dict;
}) {
  const { publicKey, connected } = useWallet();
  const [tab, setTab] = useState<Tab>("members");

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [initiatives, setInitiatives] = useState<Initiative[]>(initialInitiatives);

  // form state
  const [nameKa, setNameKa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [wallet, setWallet] = useState("");
  const [qKa, setQKa] = useState("");
  const [qEn, setQEn] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [endDate, setEndDate] = useState("");

  const demoMode = ADMIN_WALLET === "";
  const isAdmin = demoMode || (connected && publicKey?.toBase58() === ADMIN_WALLET);

  if (!isAdmin) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock size={22} />
        </div>
        <p className="text-sm text-slate-600">
          {connected ? dict.admin.restricted : dict.admin.connectFirst}
        </p>
        {!connected && (
          <div className="mt-5 flex justify-center">
            <WalletButton />
          </div>
        )}
      </div>
    );
  }

  const addMember = () => {
    if (!nameKa.trim() || !nameEn.trim() || !wallet.trim()) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        name: { ka: nameKa.trim(), en: nameEn.trim() },
        wallet: wallet.trim(),
        role: "member",
        joined: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNameKa("");
    setNameEn("");
    setWallet("");
  };

  const createPoll = () => {
    const opts = optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!qKa.trim() || !qEn.trim() || opts.length < 2 || !endDate) return;
    setPolls((prev) => [
      {
        id: `p${Date.now()}`,
        title: { ka: qKa.trim(), en: qEn.trim() },
        // The same text is used for both languages; edit per language later.
        options: opts.map((label, i) => ({
          id: `o${i}`,
          label: { ka: label, en: label },
          votes: 0,
        })),
        endsAt: endDate,
        closed: false,
      },
      ...prev,
    ]);
    setQKa("");
    setQEn("");
    setOptionsText("");
    setEndDate("");
  };

  const tabs: Tab[] = ["members", "polls", "initiatives"];

  return (
    <div>
      {demoMode && <Notice>{dict.admin.demoMode}</Notice>}
      <Notice>{dict.common.demoNotice}</Notice>

      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {dict.admin.tabs[t]}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-1">
            <h3 className="mb-4 font-semibold">{dict.admin.addMember}</h3>
            <div className="space-y-3">
              <input className="input" placeholder={dict.admin.fullNameKa} value={nameKa} onChange={(e) => setNameKa(e.target.value)} />
              <input className="input" placeholder={dict.admin.fullNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              <input className="input font-mono" placeholder={dict.admin.walletAddress} value={wallet} onChange={(e) => setWallet(e.target.value)} />
              <button className="btn btn-primary w-full" onClick={addMember}>
                {dict.admin.add}
              </button>
            </div>
          </div>
          <div className="card overflow-x-auto lg:col-span-2">
            <table className="w-full min-w-[420px] text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3 font-medium">{m.name[locale]}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{shortWallet(m.wallet)}</td>
                    <td className="px-5 py-3 text-right">
                      {m.role !== "admin" && (
                        <button
                          className="btn btn-ghost !px-2 !py-1.5"
                          aria-label={dict.admin.remove}
                          onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "polls" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-1">
            <h3 className="mb-4 font-semibold">{dict.admin.createPoll}</h3>
            <div className="space-y-3">
              <input className="input" placeholder={dict.admin.pollTitleKa} value={qKa} onChange={(e) => setQKa(e.target.value)} />
              <input className="input" placeholder={dict.admin.pollTitleEn} value={qEn} onChange={(e) => setQEn(e.target.value)} />
              <textarea className="input min-h-[96px]" placeholder={dict.admin.optionsHint} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
              <label className="block text-xs text-slate-500">
                {dict.admin.endDate}
                <input type="date" className="input mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
              <button className="btn btn-primary w-full" onClick={createPoll}>
                {dict.admin.create}
              </button>
            </div>
          </div>
          <div className="space-y-3 lg:col-span-2">
            {polls.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-sm font-medium">{p.title[locale]}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {dict.common.endsOn}: {fmtDate(p.endsAt, locale)}
                  </div>
                </div>
                {p.closed ? (
                  <span className="text-xs text-slate-400">{dict.admin.closed}</span>
                ) : (
                  <button
                    className="btn btn-ghost shrink-0"
                    onClick={() =>
                      setPolls((prev) => prev.map((x) => (x.id === p.id ? { ...x, closed: true } : x)))
                    }
                  >
                    {dict.admin.closePoll}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "initiatives" && (
        <div className="space-y-3">
          <h3 className="font-semibold">{dict.admin.pendingOnly}</h3>
          {initiatives.map((i) => (
            <div key={i.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.title[locale]}</div>
                <div className="mt-1">
                  <StatusBadge status={i.status} label={dict.initiatives.status[i.status]} />
                </div>
              </div>
              {i.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      setInitiatives((prev) => prev.map((x) => (x.id === i.id ? { ...x, status: "approved" } : x)))
                    }
                  >
                    <Check size={16} /> {dict.admin.approve}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setInitiatives((prev) => prev.map((x) => (x.id === i.id ? { ...x, status: "rejected" } : x)))
                    }
                  >
                    <X size={16} /> {dict.admin.reject}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
