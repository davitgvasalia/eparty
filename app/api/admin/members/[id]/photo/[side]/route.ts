import { db } from "@/lib/server/db";
import { readPhoto } from "@/lib/server/photos";
import { HttpError, handle, requireAdmin } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Serves a member's ID photo to the administrator only. */
export const GET = handle(async (_req: Request, { params }: { params: { id: string; side: string } }) => {
  await requireAdmin();
  if (params.side !== "front" && params.side !== "back") throw new HttpError(404, "Not found");
  const m = await db.member.findUnique({ where: { id: params.id } });
  const name = params.side === "front" ? m?.idFront : m?.idBack;
  if (!name) throw new HttpError(404, "Not found");
  const { bytes, type } = await readPhoto(name);
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": type, "Cache-Control": "private, no-store" },
  });
});
