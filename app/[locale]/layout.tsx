import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";
import { themeInitScript } from "@/components/ThemeToggle";
import { getDict } from "@/lib/dictionaries";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const dict = getDict(params.locale);
  return {
    title: dict.appName,
    description: dict.tagline,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192" }],
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: { capable: true, title: "E-Party", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-*) report the space under the phone's system bars.
  viewportFit: "cover",
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <Shell locale={locale} dict={dict}>
            {children}
          </Shell>
        </Providers>
      </body>
    </html>
  );
}
