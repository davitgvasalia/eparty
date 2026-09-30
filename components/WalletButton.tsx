"use client";

import dynamic from "next/dynamic";

// Rendered only on the client to avoid hydration mismatches.
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function WalletButton() {
  return <WalletMultiButton />;
}
