import type { Prisma } from "@prisma/client";
import {
  IMAGE_TYPES,
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_MESSAGE_BYTES,
  MAX_TEXT,
  MAX_VOICE_SECONDS,
  PAGE_SIZE,
  VOICE_TYPES,
  type MessagePage,
} from "@/lib/chat";
import { messageInclude, publish, readableChat, toChatMessage, writableChat } from "@/lib/server/chat";
import { deleteChatFiles, saveChatFile } from "@/lib/server/chatFiles";
import { db } from "@/lib/server/db";
import { HttpError, getViewer, handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

const time = (v: string | null) => {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, "Invalid time");
  return d;
};

/**
 * ?since=<time>: every message created, edited or deleted after that time.
 * Otherwise the latest page of messages, or the page before ?before=<time>.
 */
export const GET = handle(async (req: Request, { params }: { params: { id: string } }) => {
  await readableChat(await getViewer(), params.id);
  const url = new URL(req.url);
  const since = time(url.searchParams.get("since"));
  const before = time(url.searchParams.get("before"));

  if (since) {
    const messages = await db.message.findMany({
      where: { chatId: params.id, updatedAt: { gt: since } },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
    });
    return { messages: messages.map(toChatMessage), hasMore: false } satisfies MessagePage;
  }

  const rows = await db.message.findMany({
    where: { chatId: params.id, ...(before && { createdAt: { lt: before } }) },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  });
  const page = rows.slice(0, PAGE_SIZE).reverse();
  return { messages: page.map(toChatMessage), hasMore: rows.length > PAGE_SIZE } satisfies MessagePage;
});

const baseMime = (type: string) => type.split(";")[0].trim().toLowerCase();

/** Sends a message: multipart form with "text", any number of "files" and at most one "voice". */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const chat = await writableChat(await getViewer(), params.id);
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Invalid request body");
  });

  const text = String(form.get("text") ?? "").trim();
  if (text.length > MAX_TEXT) throw new HttpError(400, "Message is too long");

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const voice = form.get("voice");
  if (files.length > MAX_FILES) throw new HttpError(400, `At most ${MAX_FILES} files per message`);
  const all = [...files, ...(voice instanceof File ? [voice] : [])];
  if (!text && all.length === 0) throw new HttpError(400, "Message is empty");
  if (all.some((f) => f.size > MAX_FILE_BYTES) || all.reduce((s, f) => s + f.size, 0) > MAX_MESSAGE_BYTES)
    throw new HttpError(400, "tooLarge");

  let duration: number | undefined;
  if (voice instanceof File) {
    if (!VOICE_TYPES.includes(baseMime(voice.type))) throw new HttpError(400, "Unsupported voice format");
    duration = Math.round(Number(form.get("duration")));
    if (!Number.isFinite(duration) || duration < 0 || duration > MAX_VOICE_SECONDS + 5) duration = undefined;
  }

  const saved: string[] = [];
  try {
    const attachments: Prisma.AttachmentCreateWithoutMessageInput[] = [];
    for (const f of files) {
      const mime = baseMime(f.type) || "application/octet-stream";
      const file = await saveChatFile(Buffer.from(await f.arrayBuffer()));
      saved.push(file);
      const kind = IMAGE_TYPES.includes(mime) ? ("image" as const) : ("file" as const);
      attachments.push({ kind, name: (f.name || "file").slice(0, 200), mime, size: f.size, file });
    }
    if (voice instanceof File) {
      const file = await saveChatFile(Buffer.from(await voice.arrayBuffer()));
      saved.push(file);
      attachments.push({ kind: "voice" as const, name: voice.name || "voice", mime: baseMime(voice.type), size: voice.size, file, duration });
    }

    const message = await db.$transaction(async (tx) => {
      const m = await tx.message.create({
        data: { chatId: chat.id, senderId: chat.member.id, text, attachments: { create: attachments } },
        include: messageInclude,
      });
      await tx.chat.update({ where: { id: chat.id }, data: { lastAt: m.createdAt } });
      // Sending means the sender has read everything before it.
      await tx.chatMember.updateMany({ where: { chatId: chat.id, memberId: chat.member.id }, data: { lastReadAt: m.createdAt } });
      return m;
    });
    await publish(chat.id);
    return toChatMessage(message);
  } catch (e) {
    await deleteChatFiles(saved);
    throw e;
  }
});
