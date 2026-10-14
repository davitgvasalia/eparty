import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { body, handle, requireMember, str } from "@/lib/server/viewer";

/** A member proposes an initiative. It starts in the preparatory stage. */
export const POST = handle(async (req: Request) => {
  const { member } = await requireMember();
  const b = await body(req);
  await db.initiative.create({
    data: {
      titleKa: str(b, "titleKa", 300),
      titleEn: str(b, "titleEn", 300),
      summaryKa: str(b, "summaryKa", 5000),
      summaryEn: str(b, "summaryEn", 5000),
      authorId: member.id,
      createdAt: todayIso(),
    },
  });
});
