import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { handle, requireAdmin } from "@/lib/server/viewer";

export const POST = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  await db.poll.updateMany({ where: { id: params.id, closedAt: null }, data: { closedAt: todayIso() } });
});
