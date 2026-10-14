import { pollFinished, pollStarted, todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { HttpError, body, handle, requireMember, str } from "@/lib/server/viewer";

/** One member, one vote per poll. */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const { member } = await requireMember();
  const optionId = str(await body(req), "optionId", 64);

  const poll = await db.poll.findUnique({ where: { id: params.id }, include: { options: { select: { id: true } } } });
  if (!poll) throw new HttpError(404, "Poll not found");
  const today = todayIso();
  const state = { startsAt: poll.startsAt ?? undefined, endsAt: poll.endsAt, closed: !!poll.closedAt };
  if (!pollStarted(state, today)) throw new HttpError(400, "Voting has not started");
  if (pollFinished(state, today)) throw new HttpError(400, "Voting has ended");
  if (!poll.options.some((o) => o.id === optionId)) throw new HttpError(400, "Unknown option");

  await db.pollVote.create({ data: { pollId: poll.id, memberId: member.id, optionId } });
});
