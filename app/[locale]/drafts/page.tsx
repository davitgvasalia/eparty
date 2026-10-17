import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, Notice } from "@/components/ui";
import { InitiativeForm, InitiativeList } from "@/components/InitiativeViews";

export default function DraftsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.initiatives.draftsTitle} subtitle={dict.initiatives.draftsSubtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <div className="space-y-6">
        <InitiativeForm dict={dict} />
        <InitiativeList stage="draft" locale={locale} dict={dict} />
      </div>
    </>
  );
}
