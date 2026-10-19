import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

/** True for a canonical base58 Solana address (the round trip rejects short or padded input). */
export function isWallet(s: string): boolean {
  try {
    return new PublicKey(s).toBase58() === s;
  } catch {
    return false;
  }
}

export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

/** Treasury that receives the poll vote fee. Empty turns the fee off. */
export const VOTE_FEE_WALLET = process.env.NEXT_PUBLIC_VOTE_FEE_WALLET || "";
export const VOTE_FEE_SOL = Number(process.env.NEXT_PUBLIC_VOTE_FEE_SOL || "0.01");
export const VOTE_FEE_LAMPORTS = Math.round(VOTE_FEE_SOL * LAMPORTS_PER_SOL);
