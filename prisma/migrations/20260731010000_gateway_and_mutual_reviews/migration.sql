-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('pending', 'confirmed', 'failed', 'expired');

-- DropIndex
DROP INDEX "Review_dealId_key";

-- DropIndex
DROP INDEX "Review_subjectId_idx";

-- AlterTable
ALTER TABLE "PaymentMethodConfig" ADD COLUMN     "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT;

-- AlterTable
-- Reviews used to be buyer-to-seller only, so every existing row has a seller
-- as its subject. Backfill with that, then drop the default so new rows must
-- state the side explicitly.
ALTER TABLE "Review" ADD COLUMN "subjectSide" "DealSide" NOT NULL DEFAULT 'seller';
ALTER TABLE "Review" ALTER COLUMN "subjectSide" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'pending',
    "lastPayload" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_externalId_key" ON "PaymentIntent"("externalId");

-- CreateIndex
CREATE INDEX "PaymentIntent_dealId_idx" ON "PaymentIntent"("dealId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Review_subjectId_createdAt_idx" ON "Review"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_dealId_authorId_key" ON "Review"("dealId", "authorId");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

