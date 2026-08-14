-- The referral program, and the end of the commission.
--
-- Three things happen here:
--   1. every user becomes a promoter, with a code and the promoter above them
--   2. ReferralEarning starts recording the $2 a completed deal owes a promoter
--   3. Withdrawal stops being a seller payout and becomes a promoter payout
--
-- Hand-written rather than taken from `migrate diff`, which wanted to add
-- User.referralCode as NOT NULL with no backfill (fails against any existing
-- row) and to DROP Withdrawal.sellerId and ADD promoterId (which would orphan
-- every withdrawal ever requested). Both are done non-destructively below.

-- ---------------------------------------------------------------------------
-- User: a code for everyone, and who introduced them
-- ---------------------------------------------------------------------------

-- Nullable first, so existing rows survive the ADD.
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- Backfill a code for everyone who registered before promoters existed.
--
-- row_number() is what makes this safe: to_hex of a distinct integer is
-- distinct, and translate() maps each hex digit to one letter, so the result is
-- distinct too. The unique index below therefore cannot fail. The alphabet is
-- the readable one from src/lib/ids.ts (no O/0, no I/1) because these get read
-- aloud, and the 16 letters used here are exactly its first 16.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n FROM "User"
)
UPDATE "User" u
SET "referralCode" =
  'PES-' || translate(lpad(to_hex(numbered.n), 6, '0'), '0123456789abcdef', 'ABCDEFGHJKMNPQRS')
FROM numbered
WHERE u.id = numbered.id;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- SET NULL: deleting a promoter must not delete the people they introduced.
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ReferralEarning: $2, once, per side of a completed deal
-- ---------------------------------------------------------------------------

CREATE TABLE "ReferralEarning" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 200,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralEarning_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralEarning_promoterId_createdAt_idx" ON "ReferralEarning"("promoterId", "createdAt");

-- The guard that makes crediting idempotent: a deal that reaches "completed"
-- twice pays the promoter once. Keyed on the trader, so a deal whose two sides
-- share one promoter still writes the two rows it owes.
CREATE UNIQUE INDEX "ReferralEarning_dealId_traderId_key" ON "ReferralEarning"("dealId", "traderId");

ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_promoterId_fkey"
  FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_traderId_fkey"
  FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralEarning" ADD CONSTRAINT "ReferralEarning_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Withdrawal: a promoter payout, not a seller payout
-- ---------------------------------------------------------------------------

-- RENAME, not DROP + ADD. Every withdrawal already requested keeps the person
-- it belongs to.
ALTER TABLE "Withdrawal" RENAME COLUMN "sellerId" TO "promoterId";

ALTER TABLE "Withdrawal" RENAME CONSTRAINT "Withdrawal_sellerId_fkey" TO "Withdrawal_promoterId_fkey";
ALTER INDEX "Withdrawal_sellerId_requestedAt_idx" RENAME TO "Withdrawal_promoterId_requestedAt_idx";

-- ---------------------------------------------------------------------------
-- Deal: swap by default, and no money
-- ---------------------------------------------------------------------------

-- Existing rows keep the figures they were agreed under. Only the defaults
-- change, so anything created from here carries zeros.
ALTER TABLE "Deal" ALTER COLUMN "tradeKind" SET DEFAULT 'swap',
  ALTER COLUMN "agreedPriceCents" SET DEFAULT 0,
  ALTER COLUMN "sellerPayoutCents" SET DEFAULT 0;
