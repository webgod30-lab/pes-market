-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "DealSide" AS ENUM ('seller', 'buyer');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('awaiting_counterparty', 'awaiting_credentials', 'awaiting_payment', 'payment_submitted', 'admin_verifying', 'credentials_released', 'claiming', 'completed', 'disputed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('crypto', 'card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "inviteCode" TEXT,
    "inviteAcceptedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdSide" "DealSide" NOT NULL,
    "sellerId" TEXT,
    "buyerId" TEXT,
    "accountSummary" TEXT NOT NULL,
    "game" TEXT NOT NULL DEFAULT 'eFootball',
    "platform" TEXT,
    "level" INTEGER,
    "agreedPriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "feeBps" INTEGER NOT NULL DEFAULT 0,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "sellerPayoutCents" INTEGER NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'awaiting_counterparty',
    "paymentMethod" "PaymentMethod",
    "paymentTxHash" TEXT,
    "paymentReference" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "paymentConfirmedById" TEXT,
    "verificationStartedAt" TIMESTAMP(3),
    "deliveryApprovedAt" TIMESTAMP(3),
    "deliveryApprovedById" TEXT,
    "deliveredCiphertext" TEXT,
    "credentialsReleasedAt" TIMESTAMP(3),
    "confirmationDeadline" TIMESTAMP(3),
    "buyerConfirmedAt" TIMESTAMP(3),
    "lastReminderSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "payoutAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastVerifiedById" TEXT,
    "verificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isAdminNote" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_reference_key" ON "Deal"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_inviteCode_key" ON "Deal"("inviteCode");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "Deal_sellerId_status_idx" ON "Deal"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Deal_buyerId_status_idx" ON "Deal"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Deal_createdById_idx" ON "Deal"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_dealId_key" ON "Credential"("dealId");

-- CreateIndex
CREATE INDEX "Message_dealId_createdAt_idx" ON "Message"("dealId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_dealId_key" ON "Review"("dealId");

-- CreateIndex
CREATE INDEX "Review_subjectId_idx" ON "Review"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_dealId_key" ON "Dispute"("dealId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_paymentConfirmedById_fkey" FOREIGN KEY ("paymentConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_deliveryApprovedById_fkey" FOREIGN KEY ("deliveryApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_lastVerifiedById_fkey" FOREIGN KEY ("lastVerifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
