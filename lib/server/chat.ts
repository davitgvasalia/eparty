import "server-only";
import type { Attachment, Chat, Member as DbMember, Message } from "@prisma/client";
import { GENERAL_CHAT, type ChatMessage, type ChatSummary } from "../chat";
import { db } from "./db";
import { deleteChatFiles } from "./chatFiles";
import { HttpError, type Viewer } from "./viewer";

// ---- Live updates ----------------------------------------------------------------------
// Open /api/chat/events streams register here and hear which chat changed; the browser
// then fetches what is new. This lives in memory, which is enough for the single app
// process the server runs (deploy/eparty.service).

interface Listener {
  memberId?: string;
  isAdmin: boolean;
  send: (chatId: string) => void;
}

const g = globalThis as unknown as { chatListeners?: Set<Listener> };
const listeners = (g.chatListeners ??= new Set());

export function listen(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Tells everyone who can see the chat that it changed. Pass extra member ids to reach
 * people who just lost access, so their list drops the chat.
 */
export async function publish(chatId: string, alsoTell: string[] = []) {
  const chat = await db.chat.findUnique({ where: { id: chatId }, include: { members: { select: { memberId: true } } } });
  const kind = chat?.kind ?? "group";
  const audience = new Set([...(chat?.members.map((m) => m.memberId) ?? []), ...alsoTell]);
  for (const l of listeners) {
    const sees =
      kind === "general" || (l.memberId && audience.has(l.memberId)) || (kind === "group" && l.isAdmin);
    if (sees) l.send(chatId);
  }
}

// ---- Access ----------------------------------------------------------------------------

type ChatWithMembers = Chat & { members: { memberId: string }[] };

/** The general chat, created the first time anyone opens the chat. */
export const ensureGeneralChat = () =>
  db.chat.upsert({ where: { id: GENERAL_CHAT }, update: {}, create: { id: GENERAL_CHAT, kind: "general" } });

const canRead = (chat: ChatWithMembers, viewer: Viewer) => {
  const memberId = viewer.member?.id;
  if (chat.kind === "general") return !!memberId || viewer.isAdmin;
  if (chat.kind === "group" && viewer.isAdmin) return true;
  return !!memberId && chat.members.some((m) => m.memberId === memberId);
};

// The administrator may write in every group; others only where they belong.
const canWrite = (chat: ChatWithMembers, viewer: Viewer) => !!viewer.member && canRead(chat, viewer);

/** Loads a chat the viewer may read, or answers 404 so hidden chats stay hidden. */
export async function readableChat(viewer: Viewer, chatId: string) {
  const chat = await db.chat.findUnique({ where: { id: chatId }, include: { members: { select: { memberId: true } } } });
  if (!chat || !canRead(chat, viewer)) throw new HttpError(404, "Chat not found");
  return chat;
}

export async function writableChat(viewer: Viewer, chatId: string) {
  const chat = await readableChat(viewer, chatId);
  if (!canWrite(chat, viewer)) throw new HttpError(403, "Only party members can write");
  return Object.assign(chat, { member: viewer.member! as DbMember });
}

// ---- Shapes sent to the browser --------------------------------------------------------

export const messageInclude = {
  attachments: true,
  sender: { select: { nameKa: true, nameEn: true } },
} as const;

type FullMessage = Message & { attachments: Attachment[]; sender: { nameKa: string; nameEn: string } };

export function toChatMessage(m: FullMessage): ChatMessage {
  return {
    id: m.id,
    chatId: m.chatId,
    senderId: m.senderId,
    senderName: { ka: m.sender.nameKa, en: m.sender.nameEn },
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt?.toISOString(),
    deleted: !!m.deletedAt,
    updatedAt: m.updatedAt.toISOString(),
    attachments: m.attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      mime: a.mime,
      size: a.size,
      duration: a.duration ?? undefined,
      url: `/api/chat/files/${a.id}`,
    })),
  };
}

/** Every chat the viewer can see, newest activity first. */
export async function loadChats(viewer: Viewer): Promise<ChatSummary[]> {
  await ensureGeneralChat();
  const memberId = viewer.member?.id;
  // A member's general-chat row starts now, so joining doesn't show the whole history as unread.
  if (memberId) {
    await db.chatMember.createMany({ data: [{ chatId: GENERAL_CHAT, memberId }], skipDuplicates: true });
  }

  const chats = await db.chat.findMany({
    where: {
      OR: [
        { kind: "general" },
        ...(viewer.isAdmin ? [{ kind: "group" as const }] : []),
        ...(memberId ? [{ members: { some: { memberId } } }] : []),
      ],
    },
    include: { members: { select: { memberId: true } } },
    orderBy: { lastAt: "desc" },
  });
  const ids = chats.map((c) => c.id);

  const [lastRows, unreadRows] = await Promise.all([
    db.$queryRaw<{ id: string; chatId: string }[]>`
      SELECT DISTINCT ON ("chatId") "id", "chatId" FROM "Message"
      WHERE "chatId" = ANY(${ids}) ORDER BY "chatId", "createdAt" DESC`,
    memberId
      ? db.$queryRaw<{ chatId: string; n: number }[]>`
          SELECT m."chatId", COUNT(*)::int AS n FROM "Message" m
          JOIN "ChatMember" cm ON cm."chatId" = m."chatId" AND cm."memberId" = ${memberId}
          WHERE m."createdAt" > cm."lastReadAt" AND m."senderId" <> ${memberId} AND m."deletedAt" IS NULL
          GROUP BY m."chatId"`
      : Promise.resolve([]),
  ]);
  const lastMessages = await db.message.findMany({
    where: { id: { in: lastRows.map((r) => r.id) } },
    include: { attachments: { select: { kind: true }, take: 1 } },
  });
  const lastBy = new Map(lastMessages.map((m) => [m.chatId, m]));
  const unreadBy = new Map(unreadRows.map((r) => [r.chatId, r.n]));

  return chats.map((c) => {
    const last = lastBy.get(c.id);
    return {
      id: c.id,
      kind: c.kind,
      name: c.name ?? undefined,
      memberIds: c.kind === "general" ? [] : c.members.map((m) => m.memberId),
      canWrite: canWrite(c, viewer),
      last: last && {
        senderId: last.senderId,
        text: last.text.slice(0, 120),
        kind: last.attachments[0]?.kind,
        deleted: !!last.deletedAt,
        at: last.createdAt.toISOString(),
      },
      unread: unreadBy.get(c.id) ?? 0,
      lastAt: c.lastAt.toISOString(),
    };
  });
}

/** Removes the files of the given messages from disk and their attachment rows. */
export async function dropAttachments(messageWhere: { id: string } | { chatId: string }) {
  const attachments = await db.attachment.findMany({ where: { message: messageWhere }, select: { file: true } });
  await db.attachment.deleteMany({ where: { message: messageWhere } });
  await deleteChatFiles(attachments.map((a) => a.file));
}

/** The requested member ids that belong to current members. */
export async function groupMemberIds(b: Record<string, unknown>): Promise<string[]> {
  const ids = b.memberIds;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new HttpError(400, "Invalid memberIds");
  const found = await db.member.findMany({ where: { id: { in: ids as string[] }, active: true }, select: { id: true } });
  return found.map((m) => m.id);
}
