import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Providers from "@/components/Providers";
import SiteAdmin from "@/components/SiteAdmin";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "E-Party · Website management",
  robots: { index: false, follow: false },
};

/** The website's management panel: browser only, administrator wallet only. */
export default function SiteAdminPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return (
    <Providers>
      <SiteAdmin locale={params.locale} dict={getDict(params.locale)} />
    </Providers>
  );
}
