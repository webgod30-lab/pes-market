-- The founding promoter rate.
--
-- A promoter approved into one of the first places earns $5 a completed swap
-- instead of $2, for 90 days. A date rather than a flag, because the offer
-- expires and a boolean cannot expire on its own — somebody would have to
-- remember to turn it off, and nobody ever does.
--
-- Null on everybody who already exists, which is correct: the offer is for
-- promoters recruited through /promote, and nobody currently on the site came
-- in that way.
--
-- Additive and nullable, so this is safe against a live database.

ALTER TABLE "User" ADD COLUMN "foundingRateUntil" TIMESTAMP(3);

-- Counting how many founding places are left, without scanning every user.
CREATE INDEX "User_foundingRateUntil_idx" ON "User"("foundingRateUntil");
