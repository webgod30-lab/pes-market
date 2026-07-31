-- DropIndex
DROP INDEX "Dispute_dealId_key";

-- CreateIndex
CREATE INDEX "Dispute_dealId_createdAt_idx" ON "Dispute"("dealId", "createdAt");
