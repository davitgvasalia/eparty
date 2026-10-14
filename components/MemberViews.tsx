"use client";

import type { Dict } from "@/lib/dictionaries";
import { fmtDate, shortWallet, type Locale } from "@/lib/i18n";
import { useDistricts, useMembers } from "./PollsStore";

export function MemberTable({ locale, dict }: { locale: Locale; dict: Dict }) {
  const members = useMembers();
  const districts = useDistricts();

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">{dict.members.name}</th>
            <th className="px-5 py-3 font-medium">{dict.members.wallet}</th>
            <th className="px-5 py-3 font-medium">{dict.members.district}</th>
            <th className="px-5 py-3 font-medium">{dict.members.role}</th>
            <th className="px-5 py-3 font-medium">{dict.members.rank}</th>
            <th className="px-5 py-3 font-medium">{dict.members.joined}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => {
            const candidate = m.candidate;
            return (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium">{m.name[locale]}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{shortWallet(m.wallet)}</td>
                <td className="px-5 py-3 text-slate-500">
                  {districts.find((d) => d.id === m.districtId)?.name[locale] ?? "-"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m.role === "admin" ? dict.members.admin : dict.members.member}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      candidate ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {candidate ? dict.members.candidate : dict.members.voter}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{m.joined ? fmtDate(m.joined, locale) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MemberCount() {
  return <>{useMembers().length}</>;
}
