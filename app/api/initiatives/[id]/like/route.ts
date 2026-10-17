import { initiativeDeadline, todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { promoteIfLiked } from "@/lib/server/state";
import { HttpError, handle, requireMember } from "@/lib/server/viewer";

/** Like a preparatory initiative. Enough likes move it to the initiatives stage. */
export const POST = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  const { member } = await requireMember();
  const initiative = await db.initiative.findUnique({ where: { id: params.id } });
  if (!initiative) throw new HttpError(404, "Initiative not found");
  if (initiative.stage !== "draft" || initiative.status !== "pending") throw new HttpError(400, "Not a preparatory initiative");
  if (initiativeDeadline({ ...initiative, promotedAt: undefined }) < todayIso()) throw new HttpError(400, "The preparatory initiative has expired");
  // With few members one like is enough to promote a draft, so authors can't like their own.
  if (initiative.authorId === member.id) throw new HttpError(403, "Authors can't like their own initiative");

  await db.$transaction(async (tx) => {
    await tx.initiativeLike.create({ data: { initiativeId: initiative.id, memberId: member.id } });
    await promoteIfLiked(tx, initiative.id);
  });
});
