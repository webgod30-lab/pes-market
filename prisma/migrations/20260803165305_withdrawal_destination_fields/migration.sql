/*
  Warnings:

  - You are about to drop the column `destination` on the `Withdrawal` table. All the data in the column will be lost.
  - Added the required column `destinationAccount` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationName` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "destination",
ADD COLUMN     "destinationAccount" TEXT NOT NULL,
ADD COLUMN     "destinationBank" TEXT,
ADD COLUMN     "destinationBic" TEXT,
ADD COLUMN     "destinationName" TEXT NOT NULL,
ADD COLUMN     "destinationNetwork" TEXT,
ADD COLUMN     "destinationProvider" TEXT;
