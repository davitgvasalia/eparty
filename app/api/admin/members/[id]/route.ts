import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireAdmin } from "@/lib/server/viewer";

/** Changes a member's role (member or admin). */
export const PATCH = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const viewer = await requireAdmin();
  const role = (await body(req)).role;
  if (role !== "member" && role !== "admin") throw new HttpError(400, "Invalid role");
  const member = await db.member.findUnique({ where: { id: params.id } });
  if (!member || !member.active) throw new HttpError(404, "Member not found");
  // Otherwise an administrator could lock themselves out of this panel.
  if (role === "member" && viewer.member?.id === member.id)
    throw new HttpError(400, "You can't remove your own administrator role");
  await db.member.update({ where: { id: member.id }, data: { role } });
});

/** Removes a member. The record is kept (inactive) so past poll votes still count. */
export const DELETE = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const member = await db.member.findUnique({ where: { id: params.id } });
  if (!member) throw new HttpError(404, "Member not found");
  if (member.role === "admin") throw new HttpError(400, "The administrator can't be removed");
  await db.member.update({ where: { id: member.id }, data: { active: false } });
});
