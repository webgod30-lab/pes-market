-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "paymentInstructionsSnapshot" TEXT;

-- CreateTable
CREATE TABLE "PaymentMethodConfig" (
    "id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT NOT NULL,
    "walletAddress" TEXT,
    "network" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethodConfig_isActive_sortOrder_idx" ON "PaymentMethodConfig"("isActive", "sortOrder");
