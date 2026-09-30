import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { polls } from "@/lib/demo-data";
import { PageHeader, Notice } from "@/components/ui";
import PollCard from "@/components/PollCard";

export default function PollsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.polls.title} subtitle={dict.polls.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <div className="grid gap-5 lg:grid-cols-2">
        {polls.map((p) => (
          <PollCard key={p.id} poll={p} locale={locale} dict={dict} />
        ))}
      </div>
    </>
  );
}
