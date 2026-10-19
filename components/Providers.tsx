"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SOLANA_RPC as ENDPOINT } from "@/lib/wallet";
import { PollsProvider } from "./PollsStore";

export default function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // The service worker (public/sw.js) makes the site installable as an app. Not in dev,
  // where it would serve stale build assets between hot reloads.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <PollsProvider>{children}</PollsProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
