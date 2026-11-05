import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader, Notice } from "@/components/ui";
import { MemberTable } from "@/components/MemberViews";

export default function MembersPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.members.title} subtitle={dict.members.subtitle} />
      <Notice>{dict.common.demoNotice}</Notice>
      <MemberTable locale={locale} dict={dict} />
    </>
  );
}
