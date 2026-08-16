-- A way in for somebody who wants to promote the site but knows nobody.
--
-- Registration needs a promoter's code, which makes the site closed: the only
-- people who can join are people who already know a member. PromoterApplication
-- is the door, with an admin on it, and the `promoter` role is what comes out
-- the other side — an account that can share a code and collect earnings but
-- cannot open or join a deal.
--
-- Additive only. Nothing is dropped, renamed or backfilled, so this is safe to
-- apply to a live database with users on it.

-- ---------------------------------------------------------------------------
-- Role: promoter
-- ---------------------------------------------------------------------------

-- Postgres refuses a new enum value inside a transaction only when the same
-- transaction also USES it. This one does not — no row is written as
-- 'promoter' here — so it is safe in Prisma's transactional migration.
ALTER TYPE "Role" ADD VALUE 'promoter';

CREATE TYPE "PromoterApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- PromoterApplication
-- ---------------------------------------------------------------------------

CREATE TABLE "PromoterApplication" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    -- bcrypt, exactly as User.passwordHash. Nullable because a rejection
    -- clears it: holding credentials for somebody with no account is not
    -- something to keep.
    "passwordHash" TEXT,
    "channel" TEXT NOT NULL,
    "status" "PromoterApplicationStatus" NOT NULL DEFAULT 'pending',
    "createdUserId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoterApplication_pkey" PRIMARY KEY ("id")
);

-- One application per address. Stops the queue being flooded with the same
-- person, and lets a second attempt update the first rather than stack behind it.
CREATE UNIQUE INDEX "PromoterApplication_email_key" ON "PromoterApplication"("email");

-- One application per resulting account, so approving twice cannot mint two.
CREATE UNIQUE INDEX "PromoterApplication_createdUserId_key" ON "PromoterApplication"("createdUserId");

-- The admin queue reads pending, oldest first.
CREATE INDEX "PromoterApplication_status_createdAt_idx" ON "PromoterApplication"("status", "createdAt");

-- SET NULL on both: deleting a promoter's account, or the admin who reviewed
-- it, must leave the record of the decision behind.
ALTER TABLE "PromoterApplication" ADD CONSTRAINT "PromoterApplication_createdUserId_fkey"
  FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromoterApplication" ADD CONSTRAINT "PromoterApplication_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
