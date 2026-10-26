import { groupMemberIds, publish } from "@/lib/server/chat";
import { db } from "@/lib/server/db";
import { body, handle, requireAdmin, str } from "@/lib/server/viewer";

/** Creates a group with a name and chosen members. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await body(req);
  const name = str(b, "name", 100);
  const memberIds = await groupMemberIds(b);
  const chat = await db.chat.create({
    data: { kind: "group", name, members: { create: memberIds.map((memberId) => ({ memberId })) } },
  });
  await publish(chat.id);
  return { id: chat.id };
});
