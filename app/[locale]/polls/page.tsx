import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, Notice } from "@/components/ui";
import { PollList } from "@/components/PollViews";

export default function PollsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.polls.title} subtitle={dict.polls.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <PollList locale={locale} dict={dict} />
    </>
  );
}
