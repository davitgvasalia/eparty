"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import { getDict } from "@/lib/dictionaries";
import { isLocale, shortWallet } from "@/lib/i18n";
import WalletButton from "@/components/WalletButton";

export default function LoginPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "ka";
  const dict = getDict(locale);
  const { connected, publicKey } = useWallet();

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Wallet size={26} />
        </div>
        <h1 className="text-xl font-semibold">{dict.login.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{dict.login.subtitle}</p>

        <ol className="mt-6 space-y-3 text-left text-sm">
          {dict.login.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col items-center gap-3">
          {connected && publicKey ? (
            <>
              <p className="text-sm text-emerald-700">
                {dict.login.connected}: {shortWallet(publicKey.toBase58())}
              </p>
              <Link href={`/${locale}`} className="btn btn-primary">
                {dict.login.goHome}
              </Link>
            </>
          ) : (
            <WalletButton />
          )}
        </div>
        <p className="mt-6 text-xs text-slate-400">{dict.login.note}</p>
      </div>
    </div>
  );
}
