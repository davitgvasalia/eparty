import { db } from "@/lib/server/db";
import { newsFields } from "@/lib/server/news";
import { body, handle, requireAdmin } from "@/lib/server/viewer";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  await db.news.create({ data: newsFields(await body(req)) });
});
