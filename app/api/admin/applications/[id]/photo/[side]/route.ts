import { db } from "@/lib/server/db";
import { readPhoto } from "@/lib/server/photos";
import { HttpError, handle, requireAdmin } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Serves an applicant's ID photo to the administrator only. */
export const GET = handle(async (_req: Request, { params }: { params: { id: string; side: string } }) => {
  await requireAdmin();
  if (params.side !== "front" && params.side !== "back") throw new HttpError(404, "Not found");
  const a = await db.application.findUnique({ where: { id: params.id } });
  if (!a) throw new HttpError(404, "Not found");
  const { bytes, type } = await readPhoto(params.side === "front" ? a.idFront : a.idBack);
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": type, "Cache-Control": "private, no-store" },
  });
});
