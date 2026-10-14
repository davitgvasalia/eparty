import { todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { deletePhotos } from "@/lib/server/photos";
import { HttpError, body, handle, requireAdmin } from "@/lib/server/viewer";

/**
 * Approve (the applicant becomes a member) or reject an application. Either way the
 * application and its ID photos are deleted; the photos are not kept on the member.
 */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const action = (await body(req)).action;
  if (action !== "approve" && action !== "reject") throw new HttpError(400, "Invalid action");
  const a = await db.application.findUnique({ where: { id: params.id } });
  if (!a) throw new HttpError(404, "Application not found");

  await db.$transaction(async (tx) => {
    if (action === "approve") {
      const data = { nameKa: a.nameKa, nameEn: a.nameEn, districtId: a.districtId, phone: a.phone, email: a.email };
      await tx.member.upsert({
        where: { wallet: a.wallet },
        update: { ...data, active: true },
        create: { ...data, wallet: a.wallet, joined: todayIso() },
      });
    }
    await tx.application.delete({ where: { id: a.id } });
  });
  await deletePhotos(a.idFront, a.idBack);
});
