-- CreateEnum
CREATE TYPE "TradeKind" AS ENUM ('cash', 'swap');
-- DropIndex
DROP INDEX "Credential_dealId_key";
-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "side" "DealSide" NOT NULL DEFAULT 'seller';
-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "counterAccountSummary" TEXT,
ADD COLUMN     "sellerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "tradeKind" "TradeKind" NOT NULL DEFAULT 'cash';
-- CreateIndex
CREATE UNIQUE INDEX "Credential_dealId_side_key" ON "Credential"("dealId", "side");
