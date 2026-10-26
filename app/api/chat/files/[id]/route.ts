import { readableChat } from "@/lib/server/chat";
import { readChatFile } from "@/lib/server/chatFiles";
import { db } from "@/lib/server/db";
import { HttpError, getViewer, handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Serves an attachment to people who can read its chat. Supports byte ranges for audio. */
export const GET = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const a = await db.attachment.findUnique({ where: { id: params.id }, include: { message: { select: { chatId: true } } } });
  if (!a) throw new HttpError(404, "Not found");
  await readableChat(await getViewer(), a.message.chatId);
  const bytes = await readChatFile(a.file);

  // Pictures and voice play in the page; anything else is only ever downloaded.
  const inline = a.kind !== "file";
  const headers: Record<string, string> = {
    "Content-Type": inline ? a.mime : "application/octet-stream",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(a.name)}`,
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=86400",
    "Accept-Ranges": "bytes",
  };

  // Safari only plays audio served in ranges.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = bytes.length;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Length": String(bytes.length) } });
});
