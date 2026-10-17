import { db } from "@/lib/server/db";
import { decodeImage, deletePhotos, savePhoto } from "@/lib/server/photos";
import { HttpError, body, handle, str } from "@/lib/server/viewer";
import { isWallet } from "@/lib/wallet";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

// Applying needs no sign-in, so cap submissions per IP (in memory; resets on restart).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimit(req: Request) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) throw new HttpError(429, "Too many applications, try again later");
  hits.push(now);
  recent.set(ip, hits);
}

/**
 * Public membership application. No sign-in: the applicant types their wallet address,
 * and the administrator checks the ID photos before approving.
 */
export const POST = handle(async (req: Request) => {
  rateLimit(req);

  const b = await body(req);
  const wallet = str(b, "wallet", 64);
  const nameKa = str(b, "nameKa", 200);
  const nameEn = str(b, "nameEn", 200);
  const phone = str(b, "phone", 30);
  const email = str(b, "email", 200);
  const districtId = str(b, "districtId", 64);
  if (!isWallet(wallet)) throw new HttpError(400, "badWallet");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "badEmail");
  if (!PHONE_RE.test(phone)) throw new HttpError(400, "badPhone");
  const front = decodeImage(b.idFront, "idFront");
  const back = decodeImage(b.idBack, "idBack");

  if (await db.member.findFirst({ where: { wallet, active: true } })) throw new HttpError(409, "alreadyMember");
  if (await db.application.findUnique({ where: { wallet } })) throw new HttpError(409, "alreadyApplied");
  if (!(await db.district.findUnique({ where: { id: districtId } }))) throw new HttpError(400, "Unknown district");

  const [idFront, idBack] = await Promise.all([savePhoto(front), savePhoto(back)]);
  try {
    await db.application.create({ data: { nameKa, nameEn, wallet, phone, email, districtId, idFront, idBack } });
  } catch (e) {
    await deletePhotos(idFront, idBack);
    throw e;
  }
});
