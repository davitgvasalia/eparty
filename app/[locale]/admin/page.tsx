import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <>
      <PageHeader title={dict.admin.title} subtitle={dict.admin.subtitle} />
      <AdminPanel locale={locale} dict={dict} />
    </>
  );
}
