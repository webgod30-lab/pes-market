-- CreateTable
CREATE TABLE "TransferCode" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "requestNote" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ciphertext" TEXT,
    "providedById" TEXT,
    "providedAt" TIMESTAMP(3),

    CONSTRAINT "TransferCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferCode_dealId_requestedAt_idx" ON "TransferCode"("dealId", "requestedAt");

-- CreateIndex
CREATE INDEX "TransferCode_providedAt_idx" ON "TransferCode"("providedAt");

-- AddForeignKey
ALTER TABLE "TransferCode" ADD CONSTRAINT "TransferCode_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCode" ADD CONSTRAINT "TransferCode_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCode" ADD CONSTRAINT "TransferCode_providedById_fkey" FOREIGN KEY ("providedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
