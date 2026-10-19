"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

// Rendered only on the client to avoid hydration mismatches.
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

// Mobile browsers never get the wallet's injected provider. On Android (Chrome and the
// E-Party app) the Mobile Wallet Adapter, which WalletProvider adds on its own, connects
// to Phantom or Solflare directly. iOS has no such adapter, so there the page has to be
// reopened inside the wallet's in-app browser via its universal link.
function needsWalletBrowser() {
  const w = window as unknown as { phantom?: { solana?: unknown }; solana?: unknown; solflare?: unknown };
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasProvider = Boolean(w.phantom?.solana || w.solana || w.solflare);
  return isIos && !hasProvider;
}

export default function WalletButton() {
  const params = useParams<{ locale?: string }>();
  const ka = params?.locale !== "en";
  const [mobileLinks, setMobileLinks] = useState<{ phantom: string; solflare: string } | null>(null);

  useEffect(() => {
    if (!needsWalletBrowser()) return;
    const url = encodeURIComponent(window.location.href);
    const ref = encodeURIComponent(window.location.origin);
    setMobileLinks({
      phantom: `https://phantom.app/ul/browse/${url}?ref=${ref}`,
      solflare: `https://solflare.com/ul/v1/browse/${url}?ref=${ref}`,
    });
  }, []);

  if (mobileLinks) {
    return (
      <div className="flex flex-col items-center gap-1">
        <a href={mobileLinks.phantom} className="btn btn-primary whitespace-nowrap">
          {ka ? "Phantom-ში გახსნა" : "Open in Phantom"}
        </a>
        <a href={mobileLinks.solflare} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
          {ka ? "ან Solflare-ში" : "or in Solflare"}
        </a>
      </div>
    );
  }

  return <WalletMultiButton />;
}
