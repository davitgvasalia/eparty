-- AlterTable
ALTER TABLE "PollVote" ADD COLUMN "feeTx" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_feeTx_key" ON "PollVote"("feeTx");
