import { db } from "@/lib/server/db";
import { HttpError, handle, requireAdmin } from "@/lib/server/viewer";

/** Removes a member. The record is kept (inactive) so past poll votes still count. */
export const DELETE = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const member = await db.member.findUnique({ where: { id: params.id } });
  if (!member) throw new HttpError(404, "Member not found");
  if (member.role === "admin") throw new HttpError(400, "The administrator can't be removed");
  await db.member.update({ where: { id: member.id }, data: { active: false } });
});
