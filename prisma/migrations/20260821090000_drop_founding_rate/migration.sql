-- Drop the founding promoter rate.
--
-- The higher $5-for-90-days rate came from an advisory pack rather than from
-- the product owner, whose specification is and always was a flat $2 for every
-- completed deal. Reverted to that.
--
-- The column is dropped rather than left in place because nothing reads it any
-- more, and a dead column that still looks like a feature is how somebody later
-- re-implements half of one. Nothing is lost: the rate a promoter actually
-- earned is snapshotted onto each ReferralEarning row at the moment it was
-- written, so every credit keeps the amount it was created with regardless of
-- what this column said.

DROP INDEX IF EXISTS "User_foundingRateUntil_idx";

ALTER TABLE "User" DROP COLUMN IF EXISTS "foundingRateUntil";
