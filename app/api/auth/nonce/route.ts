import { issueNonce } from "@/lib/server/session";
import { handle } from "@/lib/server/viewer";

/** Starts a wallet sign-in: returns the message the wallet must sign. */
export const POST = handle(async () => ({ message: issueNonce() }));
