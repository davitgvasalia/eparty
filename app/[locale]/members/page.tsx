import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale, fmtDate, shortWallet } from "@/lib/i18n";
import { members } from "@/lib/demo-data";
import { PageHeader, Notice } from "@/components/ui";

export default function MembersPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.members.title} subtitle={dict.members.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">{dict.members.name}</th>
              <th className="px-5 py-3 font-medium">{dict.members.wallet}</th>
              <th className="px-5 py-3 font-medium">{dict.members.role}</th>
              <th className="px-5 py-3 font-medium">{dict.members.joined}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium">{m.name[locale]}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{shortWallet(m.wallet)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m.role === "admin" ? dict.members.admin : dict.members.member}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(m.joined, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
