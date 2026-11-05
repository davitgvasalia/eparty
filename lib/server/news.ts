import "server-only";
import { db } from "./db";
import { HttpError, ISO_DATE, str } from "./viewer";

const MAX_IMAGE = 1_500_000; // characters of data URL

export interface NewsItem {
  id: string;
  title: { ka: string; en: string };
  body: { ka: string; en: string };
  image?: string;
  date: string; // YYYY-MM-DD
}

/** Newest first, as the website's timeline shows them. */
export async function listNews(): Promise<NewsItem[]> {
  const rows = await db.news.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return rows.map((n) => ({
    id: n.id,
    title: { ka: n.titleKa, en: n.titleEn },
    body: { ka: n.bodyKa, en: n.bodyEn },
    image: n.image ?? undefined,
    date: n.date,
  }));
}

/** Validates the admin form's fields for create and update. */
export function newsFields(b: Record<string, unknown>) {
  const date = str(b, "date", 10);
  if (!ISO_DATE.test(date)) throw new HttpError(400, "Invalid date");
  const image = typeof b.image === "string" && b.image ? b.image : null;
  if (image && (!image.startsWith("data:image/") || image.length > MAX_IMAGE)) throw new HttpError(400, "Invalid image");
  return {
    titleKa: str(b, "titleKa", 300),
    titleEn: str(b, "titleEn", 300),
    bodyKa: str(b, "bodyKa", 10_000),
    bodyEn: str(b, "bodyEn", 10_000),
    image,
    date,
  };
}
