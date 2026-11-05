import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ChatProvider } from "@/components/ChatStore";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";

/** The app itself (voting, chat, admin). The public website under /site has its own layout. */
export default function AppLayout({
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
    <Providers>
      <ChatProvider>
        <Shell locale={locale} dict={dict}>
          {children}
        </Shell>
      </ChatProvider>
    </Providers>
  );
}
