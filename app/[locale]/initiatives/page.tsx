import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { initiatives, members } from "@/lib/demo-data";
import { PageHeader, Notice, StatusBadge } from "@/components/ui";

export default function InitiativesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.initiatives.title} subtitle={dict.initiatives.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <div className="grid gap-5 md:grid-cols-2">
        {initiatives.map((i) => {
          const author = members.find((m) => m.id === i.authorId);
          return (
            <article key={i.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{i.title[locale]}</h3>
                <StatusBadge status={i.status} label={dict.initiatives.status[i.status]} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{i.summary[locale]}</p>
              <p className="mt-4 text-xs text-slate-500">
                {dict.initiatives.author}: {author?.name[locale] ?? "-"} · {i.supporters}{" "}
                {dict.initiatives.supporters}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}
