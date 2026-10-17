import { db } from "@/lib/server/db";
import { HttpError, ISO_DATE, body, handle, requireAdmin, str } from "@/lib/server/viewer";

const MAX_IMAGE = 1_500_000; // characters of data URL

/**
 * Edit a poll's title, dates and image, including polls opened from an initiative.
 * Options are left alone so votes already cast keep their meaning.
 */
export const PATCH = handle(async (req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const b = await body(req);
  const titleKa = str(b, "titleKa", 300);
  const titleEn = str(b, "titleEn", 300);
  const startsAt = str(b, "startsAt", 10);
  const endsAt = str(b, "endsAt", 10);
  if (!ISO_DATE.test(startsAt) || !ISO_DATE.test(endsAt) || endsAt < startsAt) throw new HttpError(400, "Invalid dates");

  const image = typeof b.image === "string" && b.image ? b.image : null;
  if (image && (!image.startsWith("data:image/") || image.length > MAX_IMAGE)) throw new HttpError(400, "Invalid image");

  const { count } = await db.poll.updateMany({
    where: { id: params.id },
    data: { titleKa, titleEn, startsAt, endsAt, image },
  });
  if (!count) throw new HttpError(404, "Poll not found");
});
