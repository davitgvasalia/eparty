import { db } from "@/lib/server/db";
import { HttpError, ISO_DATE, body, handle, requireAdmin, str } from "@/lib/server/viewer";

const MAX_IMAGE = 1_500_000; // characters of data URL

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await body(req);
  const titleKa = str(b, "titleKa", 300);
  const titleEn = str(b, "titleEn", 300);
  const startsAt = str(b, "startsAt", 10);
  const endsAt = str(b, "endsAt", 10);
  if (!ISO_DATE.test(startsAt) || !ISO_DATE.test(endsAt) || endsAt < startsAt) throw new HttpError(400, "Invalid dates");

  const options = Array.isArray(b.options)
    ? b.options.filter((o): o is string => typeof o === "string" && !!o.trim()).map((o) => o.trim().slice(0, 300))
    : [];
  if (options.length < 2) throw new HttpError(400, "At least two options are needed");

  const image = typeof b.image === "string" && b.image ? b.image : null;
  if (image && (!image.startsWith("data:image/") || image.length > MAX_IMAGE)) throw new HttpError(400, "Invalid image");

  await db.poll.create({
    data: {
      titleKa,
      titleEn,
      startsAt,
      endsAt,
      image,
      // The same text is used for both languages.
      options: { create: options.map((label, position) => ({ labelKa: label, labelEn: label, position })) },
    },
  });
});
