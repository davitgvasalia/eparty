import { pollFinished, pollStarted, todayIso } from "@/lib/model";
import { db } from "@/lib/server/db";
import { verifyVoteFee } from "@/lib/server/voteFee";
import { HttpError, body, handle, requireMember, str } from "@/lib/server/viewer";
import { VOTE_FEE_WALLET } from "@/lib/wallet";

/** One member, one vote per poll. With a treasury configured, the vote needs a paid fee transaction. */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const { member } = await requireMember();
  const b = await body(req);
  const optionId = str(b, "optionId", 64);
  const feeTx = VOTE_FEE_WALLET ? str(b, "feeTx", 128) : undefined;

  const poll = await db.poll.findUnique({ where: { id: params.id }, include: { options: { select: { id: true } } } });
  if (!poll) throw new HttpError(404, "Poll not found");
  const today = todayIso();
  const state = { startsAt: poll.startsAt ?? undefined, endsAt: poll.endsAt, closed: !!poll.closedAt };
  if (!pollStarted(state, today)) throw new HttpError(400, "Voting has not started");
  if (pollFinished(state, today)) throw new HttpError(400, "Voting has ended");
  if (!poll.options.some((o) => o.id === optionId)) throw new HttpError(400, "Unknown option");

  if (feeTx) {
    if (await db.pollVote.findUnique({ where: { feeTx } })) throw new HttpError(409, "This payment was already used");
    await verifyVoteFee(feeTx, member.wallet);
  }

  await db.pollVote.create({ data: { pollId: poll.id, memberId: member.id, optionId, feeTx } });
});
