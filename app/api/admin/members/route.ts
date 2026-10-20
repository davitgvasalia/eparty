import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { decodeImage, deletePhotos, savePhoto } from "@/lib/server/photos";
import { HttpError, body, handle, requireAdmin, str } from "@/lib/server/viewer";
import { isWallet } from "@/lib/wallet";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

/** Adds a member directly. A previously removed wallet is brought back. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await body(req);
  const nameKa = str(b, "nameKa", 200);
  const nameEn = str(b, "nameEn", 200);
  const wallet = str(b, "wallet", 64);
  const phone = str(b, "phone", 30);
  const email = str(b, "email", 200);
  const districtId = str(b, "districtId", 64);
  const role = b.role ?? "member";
  if (!isWallet(wallet)) throw new HttpError(400, "badWallet");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "badEmail");
  if (!PHONE_RE.test(phone)) throw new HttpError(400, "badPhone");
  if (role !== "member" && role !== "admin") throw new HttpError(400, "Invalid role");
  if (!(await db.district.findUnique({ where: { id: districtId } })))
    throw new HttpError(400, "Unknown district");
  const front = decodeImage(b.idFront, "idFront");
  const back = decodeImage(b.idBack, "idBack");

  const existing = await db.member.findUnique({ where: { wallet } });
  if (existing?.active) throw new HttpError(409, "alreadyMember");

  const [idFront, idBack] = await Promise.all([savePhoto(front), savePhoto(back)]);
  const data = {
    nameKa,
    nameEn,
    districtId,
    phone,
    email,
    role: role as "member" | "admin",
    idFront,
    idBack,
  };
  try {
    await db.member.upsert({
      where: { wallet },
      update: { ...data, active: true },
      create: { ...data, wallet, joined: todayIso() },
    });
  } catch (e) {
    await deletePhotos(idFront, idBack);
    throw e;
  }
  // A returning member's old photos are replaced.
  await deletePhotos(...[existing?.idFront, existing?.idBack].filter((n): n is string => !!n));
});
