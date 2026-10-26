import { listen } from "@/lib/server/chat";
import { HttpError, getViewer, handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Server-sent events: one "data: <chat id>" line whenever a chat the viewer sees changes. */
export const GET = handle(async (req: Request) => {
  const viewer = await getViewer();
  if (!viewer.member && !viewer.isAdmin) throw new HttpError(403, "Only party members can use the chat");

  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop();
        }
      };
      const unlisten = listen({ memberId: viewer.member?.id, isAdmin: viewer.isAdmin, send: (id) => write(`data: ${id}\n\n`) });
      // A comment every 25 s keeps nginx (60 s read timeout) and phones from dropping the stream.
      const ping = setInterval(() => write(": ping\n\n"), 25_000);
      stop = () => {
        clearInterval(ping);
        unlisten();
      };
      req.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {}
      });
      write("retry: 3000\n\n");
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      // Next.js would otherwise gzip the stream and hold it back; nginx would buffer it.
      "Content-Encoding": "none",
      "X-Accel-Buffering": "no",
    },
  });
});
