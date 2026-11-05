import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDict } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import ChatView from "@/components/ChatView";

export default function ChatPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDict(locale);

  // ChatView reads the open chat from ?c=, which needs a Suspense boundary.
  return (
    <Suspense>
      <ChatView locale={locale} dict={dict} />
    </Suspense>
  );
}
