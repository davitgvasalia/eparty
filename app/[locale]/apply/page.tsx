import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import ApplyForm from "@/components/ApplyForm";

export default function ApplyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.apply.title} subtitle={dict.apply.subtitle} />
      <ApplyForm locale={locale} dict={dict} />
    </>
  );
}
