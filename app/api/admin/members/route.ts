import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { body, handle, optStr, requireAdmin, str } from "@/lib/server/viewer";

/** Adds a member directly. A previously removed wallet is brought back. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await body(req);
  const data = {
    nameKa: str(b, "nameKa", 200),
    nameEn: str(b, "nameEn", 200),
    districtId: optStr(b, "districtId", 64) ?? null,
    phone: optStr(b, "phone", 30) ?? null,
    email: optStr(b, "email", 200) ?? null,
  };
  const wallet = str(b, "wallet", 64);
  await db.member.upsert({
    where: { wallet },
    update: { ...data, active: true },
    create: { ...data, wallet, joined: todayIso() },
  });
});
