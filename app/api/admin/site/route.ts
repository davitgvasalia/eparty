import { loadSite, saveSite } from "@/lib/server/site";
import { HttpError, body, handle, requireAdmin } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

const MAX_BODY = 500_000; // characters of JSON

export const GET = handle(async () => {
  await requireAdmin();
  return loadSite();
});

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) throw new HttpError(413, "Too large");
  return saveSite(await body(req));
});
