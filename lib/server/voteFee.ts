import "server-only";
import { Connection, type ParsedInstruction } from "@solana/web3.js";
import { SOLANA_RPC, VOTE_FEE_LAMPORTS, VOTE_FEE_WALLET } from "@/lib/wallet";
import { HttpError } from "./viewer";

const connection = new Connection(SOLANA_RPC, "confirmed");

/** Checks on chain that `signature` is a successful transfer of the vote fee from `payer` to the treasury. */
export async function verifyVoteFee(signature: string, payer: string): Promise<void> {
  let tx = null;
  // The client waits for confirmation, but the server's RPC node can lag a little behind.
  for (let attempt = 0; attempt < 5 && !tx; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1000));
    try {
      tx = await connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    } catch {
      throw new HttpError(400, "Invalid payment signature");
    }
  }
  if (!tx) throw new HttpError(400, "Payment transaction not found");
  if (tx.meta?.err) throw new HttpError(400, "Payment transaction failed");

  const paid = tx.transaction.message.instructions.some((ix) => {
    if (!("parsed" in ix) || ix.program !== "system") return false;
    const { type, info } = (ix as ParsedInstruction).parsed;
    return type === "transfer" && info.source === payer && info.destination === VOTE_FEE_WALLET && info.lamports >= VOTE_FEE_LAMPORTS;
  });
  if (!paid) throw new HttpError(400, "The transaction does not pay the vote fee");
}
