import { MAX_TEXT } from "@/lib/chat";
import { dropAttachments, messageInclude, publish, readableChat, toChatMessage } from "@/lib/server/chat";
import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireMember } from "@/lib/server/viewer";

async function ownMessage(id: string) {
  const viewer = await requireMember();
  const m = await db.message.findUnique({ where: { id }, include: { attachments: { select: { id: true } } } });
  if (!m || m.deletedAt) throw new HttpError(404, "Message not found");
  const chat = await readableChat(viewer, m.chatId);
  return { viewer, m, chat, mine: m.senderId === viewer.member.id };
}

/** Edits the text of one's own message. */
export const PATCH = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const { m, mine } = await ownMessage(params.id);
  if (!mine) throw new HttpError(403, "You can only edit your own messages");
  const b = await body(req);
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (text.length > MAX_TEXT) throw new HttpError(400, "Message is too long");
  if (!text && m.attachments.length === 0) throw new HttpError(400, "Message is empty");
  const updated = await db.message.update({
    where: { id: m.id },
    data: { text, editedAt: new Date() },
    include: messageInclude,
  });
  await publish(m.chatId);
  return toChatMessage(updated);
});

/** Deletes one's own message; the administrator may also delete any message outside private chats. */
export const DELETE = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  const { viewer, m, chat, mine } = await ownMessage(params.id);
  if (!mine && !(viewer.isAdmin && chat.kind !== "direct")) throw new HttpError(403, "You can only delete your own messages");
  await dropAttachments({ id: m.id });
  await db.message.update({ where: { id: m.id }, data: { text: "", deletedAt: new Date() } });
  await publish(m.chatId);
});
