import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireAdmin, str } from "@/lib/server/viewer";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const b = await body(req);
  await db.district.update({
    where: { id: params.id },
    data: { nameKa: str(b, "nameKa", 200), nameEn: str(b, "nameEn", 200) },
  });
});

/** A district that members or applications still point to can't be removed. */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const [members, applications] = await Promise.all([
    db.member.count({ where: { districtId: params.id, active: true } }),
    db.application.count({ where: { districtId: params.id } }),
  ]);
  if (members || applications) throw new HttpError(409, "districtInUse");
  // Removed members may still reference it; drop that link first.
  await db.member.updateMany({ where: { districtId: params.id }, data: { districtId: null } });
  await db.district.delete({ where: { id: params.id } });
});
