import { db } from "@/lib/server/db";
import { newsFields } from "@/lib/server/news";
import { body, handle, requireAdmin } from "@/lib/server/viewer";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  await db.news.update({ where: { id: params.id }, data: newsFields(await body(req)) });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await db.news.delete({ where: { id: params.id } });
});
