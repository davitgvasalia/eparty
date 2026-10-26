import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireMember, str } from "@/lib/server/viewer";

/** Opens the private chat with another member, creating it the first time. Returns its id. */
export const POST = handle(async (req: Request) => {
  const { member } = await requireMember();
  const otherId = str(await body(req), "memberId", 64);
  if (otherId === member.id) throw new HttpError(400, "Pick another member");
  if (!(await db.member.findFirst({ where: { id: otherId, active: true } }))) throw new HttpError(404, "Unknown member");

  const directKey = [member.id, otherId].sort().join(":");
  const chat = await db.chat.upsert({
    where: { directKey },
    update: {},
    create: {
      kind: "direct",
      directKey,
      members: { create: [{ memberId: member.id }, { memberId: otherId }] },
    },
  });
  return { id: chat.id };
});
