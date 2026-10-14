import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, Notice } from "@/components/ui";
import { InitiativeList } from "@/components/InitiativeViews";

export default function InitiativesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.initiatives.title} />
      <Notice>{dict.common.demoNotice}</Notice>
      <InitiativeList locale={locale} dict={dict} />
    </>
  );
}
