-- How a promoter actually gets paid.
--
-- The site stated the rate, the threshold and the payout date, and nowhere
-- said by what method, in what currency, or who covers the transfer fee. For
-- somebody deciding whether to put a code in front of two thousand people, an
-- unanswered payment question is not a gap — it is a signal.
--
-- Additive and nullable throughout. Safe against a live database.

-- ---------------------------------------------------------------------------
-- gift_card as a payout method
-- ---------------------------------------------------------------------------
--
-- The only rail that works for a promoter who is under 18 or unbanked, which
-- a lot of the best candidates are: PayPal needs 18+, so does a KYC'd
-- exchange, and a bank transfer needs a bank. Costs nothing to send.
--
-- Postgres only refuses a new enum value inside a transaction when the same
-- transaction also uses it. Nothing here writes one.
ALTER TYPE "PaymentMethod" ADD VALUE 'gift_card';

-- ---------------------------------------------------------------------------
-- Chosen at application, carried onto the account
-- ---------------------------------------------------------------------------

ALTER TABLE "PromoterApplication" ADD COLUMN "payoutMethod" "PaymentMethod";
ALTER TABLE "User" ADD COLUMN "preferredPayoutMethod" "PaymentMethod";

-- ---------------------------------------------------------------------------
-- The test transaction
-- ---------------------------------------------------------------------------
--
-- On a first payout the admin sends a nominal amount, the promoter confirms it
-- landed, and only then does the balance go. A crypto transfer to a mistyped
-- address cannot be reversed, and the person who typed it will not accept that
-- it was their own mistake — losing a dollar and a day is the cheaper outcome
-- than losing forty and the argument.

ALTER TABLE "Withdrawal" ADD COLUMN "testSentAt" TIMESTAMP(3),
  ADD COLUMN "testReference" TEXT,
  ADD COLUMN "testConfirmedAt" TIMESTAMP(3);
