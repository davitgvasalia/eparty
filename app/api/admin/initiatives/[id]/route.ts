import { db } from "@/lib/server/db";
import { approveInitiative } from "@/lib/server/state";
import { HttpError, body, handle, requireAdmin } from "@/lib/server/viewer";

/** Approve (open a poll) or reject a pending initiative. Drafts can only be rejected. */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const action = (await body(req)).action;
  const initiative = await db.initiative.findUnique({ where: { id: params.id } });
  if (!initiative || initiative.status !== "pending") throw new HttpError(404, "No pending initiative");

  if (action === "reject") {
    await db.initiative.update({ where: { id: initiative.id }, data: { status: "rejected" } });
  } else if (action === "approve" && initiative.stage === "initiative") {
    await db.$transaction((tx) => approveInitiative(tx, initiative.id));
  } else {
    throw new HttpError(400, "Invalid action");
  }
});
