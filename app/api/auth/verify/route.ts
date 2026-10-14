import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { completeSignIn } from "@/lib/server/session";
import { ADMIN_WALLET, HttpError, body, handle, str } from "@/lib/server/viewer";

/** Finishes a wallet sign-in by checking the signed message. */
export const POST = handle(async (req: Request) => {
  const b = await body(req);
  const wallet = str(b, "wallet", 64);
  const signature = Buffer.from(str(b, "signature", 200), "base64");
  if (!completeSignIn(wallet, signature)) throw new HttpError(401, "Signature check failed");

  // The configured administrator wallet is always a member.
  if (wallet === ADMIN_WALLET) {
    await db.member.upsert({
      where: { wallet },
      update: { active: true, role: "admin" },
      create: { wallet, role: "admin", nameKa: "ადმინისტრატორი", nameEn: "Administrator", joined: todayIso() },
    });
  }
});
