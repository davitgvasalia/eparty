import { PublicKey } from "@solana/web3.js";

/** True for a canonical base58 Solana address (the round trip rejects short or padded input). */
export function isWallet(s: string): boolean {
  try {
    return new PublicKey(s).toBase58() === s;
  } catch {
    return false;
  }
}
