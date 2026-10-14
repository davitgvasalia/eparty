import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, Notice } from "@/components/ui";
import { FinishedPollList } from "@/components/PollViews";

export default function ResultsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.results.title} subtitle={dict.results.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <FinishedPollList locale={locale} dict={dict} />
    </>
  );
}
