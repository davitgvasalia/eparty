import { db } from "@/lib/server/db";
import { body, handle, requireAdmin, str } from "@/lib/server/viewer";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await body(req);
  await db.district.create({ data: { nameKa: str(b, "nameKa", 200), nameEn: str(b, "nameEn", 200) } });
});
