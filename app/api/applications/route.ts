import { db } from "@/lib/server/db";
import { decodeImage, deletePhotos, savePhoto } from "@/lib/server/photos";
import { getViewer, HttpError, body, handle, str } from "@/lib/server/viewer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

/**
 * Public membership application. The wallet comes from the sign-in, so nobody
 * can apply with a wallet they don't own.
 */
export const POST = handle(async (req: Request) => {
  const { wallet } = await getViewer();
  if (!wallet) throw new HttpError(401, "Sign in with your wallet first");

  const b = await body(req);
  const nameKa = str(b, "nameKa", 200);
  const nameEn = str(b, "nameEn", 200);
  const phone = str(b, "phone", 30);
  const email = str(b, "email", 200);
  const districtId = str(b, "districtId", 64);
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
