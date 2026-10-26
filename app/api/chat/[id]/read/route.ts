import { GENERAL_CHAT } from "@/lib/chat";
import { db } from "@/lib/server/db";
import { handle, requireMember } from "@/lib/server/viewer";

/** Marks the chat read up to now for the signed-in member. */
export const POST = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  const { member } = await requireMember();
  // Everyone may have a general-chat row; elsewhere only an existing membership is updated,
  // so the administrator reading a group doesn't join it.
  if (params.id === GENERAL_CHAT) {
    await db.chatMember.upsert({
      where: { chatId_memberId: { chatId: GENERAL_CHAT, memberId: member.id } },
      update: { lastReadAt: new Date() },
      create: { chatId: GENERAL_CHAT, memberId: member.id },
    });
  } else {
    await db.chatMember.updateMany({ where: { chatId: params.id, memberId: member.id }, data: { lastReadAt: new Date() } });
  }
});
