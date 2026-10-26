import { dropAttachments, groupMemberIds, publish } from "@/lib/server/chat";
import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireAdmin, str } from "@/lib/server/viewer";

async function group(id: string) {
  const chat = await db.chat.findUnique({ where: { id }, include: { members: { select: { memberId: true } } } });
  if (!chat || chat.kind !== "group") throw new HttpError(404, "Group not found");
  return chat;
}

/** Renames a group and sets its members. */
export const PATCH = handle(async (req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const chat = await group(params.id);
  const b = await body(req);
  const name = str(b, "name", 100);
  const memberIds = await groupMemberIds(b);
  const before = chat.members.map((m) => m.memberId);
  await db.$transaction([
    db.chat.update({ where: { id: chat.id }, data: { name } }),
    db.chatMember.deleteMany({ where: { chatId: chat.id, memberId: { notIn: memberIds } } }),
    db.chatMember.createMany({
      data: memberIds.map((memberId) => ({ chatId: chat.id, memberId })),
      skipDuplicates: true,
    }),
  ]);
  await publish(chat.id, before);
});

/** Deletes a group with all its messages and files. */
export const DELETE = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const chat = await group(params.id);
  await dropAttachments({ chatId: chat.id });
  await db.chat.delete({ where: { id: chat.id } });
  await publish(chat.id, chat.members.map((m) => m.memberId));
});
