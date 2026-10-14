import { initiativeDeadline, todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { approveIfSupported } from "@/lib/server/state";
import { HttpError, body, handle, requireMember } from "@/lib/server/viewer";

/** Vote on putting an initiative to a poll. Enough yes votes open the poll. */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const { member } = await requireMember();
  const choice = (await body(req)).choice;
  if (choice !== "yes" && choice !== "no") throw new HttpError(400, "choice must be yes or no");

  const initiative = await db.initiative.findUnique({ where: { id: params.id } });
  if (!initiative) throw new HttpError(404, "Initiative not found");
  if (initiative.stage !== "initiative" || initiative.status !== "pending") throw new HttpError(400, "Voting is not open");
  const deadline = initiativeDeadline({
    stage: initiative.stage,
    createdAt: initiative.createdAt,
    promotedAt: initiative.promotedAt ?? undefined,
  });
  if (deadline && deadline < todayIso()) throw new HttpError(400, "The initiative has expired");

  await db.$transaction(async (tx) => {
    await tx.initiativeVote.create({ data: { initiativeId: initiative.id, memberId: member.id, yes: choice === "yes" } });
    if (choice === "yes") await approveIfSupported(tx, initiative.id);
  });
});
