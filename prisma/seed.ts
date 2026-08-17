// Seed data for local testing. Run with:  npm run db:seed
//
// Safe to run repeatedly: every write is an upsert keyed on a stable id or
// email, so you get the same fixtures instead of duplicates.
//
// Imports here are relative on purpose. This script runs under `tsx`, outside
// Next.js, so the "@/..." path alias is not guaranteed to resolve — and the
// helpers it needs have no aliased imports of their own.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/passwords";
import { encryptCredentials } from "../src/lib/crypto";
import { generateReferralCode } from "../src/lib/ids";
import { creditReferralsForDeal, REFERRAL_REWARD_CENTS } from "../src/lib/referrals";
import { formatCents } from "../src/lib/money";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

// ---------------------------------------------------------------------------
// Production guard
// ---------------------------------------------------------------------------
//
// This script writes invented people, deals and REVIEWS. On a local database
// that is test data. On a live site the same rows are fake social proof
// attached to a service that handles other people's money — which is illegal
// under the FTC's rule on fake reviews in the US, the DMCC Act in the UK and
// the Unfair Commercial Practices Directive in the EU, and which would make the
// claim on /reviews ("every review comes from a deal that actually completed")
// untrue.
//
// So: refuse unless the target really looks local. Override deliberately with
// ALLOW_REMOTE_SEED=1 if you have a remote *staging* database.
function assertSafeToSeed(url: string): void {
  if (process.env.ALLOW_REMOTE_SEED === "1") {
    console.warn("⚠ ALLOW_REMOTE_SEED=1 — seeding a non-local database on purpose.\n");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed with NODE_ENV=production. This script creates fake reviews; they must never appear on a live site.",
    );
  }

  let host: string;

  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");

  if (!isLocal) {
    throw new Error(
      [
        `Refusing to seed the database at "${host}" — it does not look local.`,
        "",
        "This script creates invented users, deals and reviews. Those are fine for",
        "development and are fake social proof anywhere else.",
        "",
        "If this really is a throwaway staging database, re-run with ALLOW_REMOTE_SEED=1.",
      ].join("\n"),
    );
  }
}

assertSafeToSeed(connectionString);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * The commission the retired cash flow charged, used only to give the archived
 * fixtures below realistic figures.
 *
 * Not read from config, and not shared with anything the app runs: nothing
 * charges a fee any more. It is a property of the historical data, so it lives
 * with the historical data.
 */
const ARCHIVED_FEE_BPS = 500;

function archivedSplit(agreedPriceCents: number) {
  const feeCents = Math.round((agreedPriceCents * ARCHIVED_FEE_BPS) / 10_000);

  return {
    agreedPriceCents,
    feeBps: ARCHIVED_FEE_BPS,
    feeCents,
    sellerPayoutCents: agreedPriceCents - feeCents,
  };
}

/** Test accounts. Passwords are intentionally simple — local fixtures only. */
const PEOPLE = [
  {
    key: "admin",
    email: "admin@pesescrow.test",
    displayName: "Escrow Admin",
    password: "Admin123!pes",
    role: "admin" as const,
  },
  {
    key: "sami",
    email: "sami@pesescrow.test",
    displayName: "Sami",
    password: "User123!pes",
    role: "user" as const,
  },
  {
    key: "yassine",
    email: "yassine@pesescrow.test",
    displayName: "Yassine",
    password: "User123!pes",
    role: "user" as const,
  },
  {
    key: "karim",
    email: "karim@pesescrow.test",
    displayName: "Karim",
    password: "User123!pes",
    role: "user" as const,
  },
];

/**
 * One deal per interesting stage of the escrow flow, so every screen you build
 * in later phases has something realistic to render.
 *
 * Note that Sami is the seller in one deal and the buyer in another — that is
 * the point of per-deal sides.
 */
const DEALS = [
  {
    id: "seed-deal-awaiting-counterparty",
    reference: "ESC-7F3K9Q",
    createdBy: "sami",
    createdSide: "seller" as const,
    seller: "sami",
    buyer: null,
    inviteCode: "seed-invite-code-awaiting-counterparty",
    accountSummary:
      "eFootball 2026 mobile account. 4 Legends (Messi, Ronaldinho, Zico, Kaka), squad rating 3200. Original email included.",
    game: "eFootball",
    platform: "Mobile",
    level: 42,
    agreedPriceCents: 18_500,
    status: "awaiting_counterparty" as const,
    credentials: null,
  },
  {
    id: "seed-deal-awaiting-credentials",
    reference: "ESC-3M8XPT",
    createdBy: "yassine",
    createdSide: "buyer" as const,
    seller: "karim",
    buyer: "yassine",
    inviteCode: null,
    accountSummary:
      "PES 2021 PC / Steam account with the full base Legends collection. Level 78.",
    game: "PES 2021",
    platform: "PC",
    level: 78,
    agreedPriceCents: 32_000,
    status: "awaiting_credentials" as const,
    credentials: null,
  },
  {
    id: "seed-deal-awaiting-payment",
    reference: "ESC-QK42VD",
    createdBy: "karim",
    createdSide: "seller" as const,
    seller: "karim",
    buyer: "sami",
    inviteCode: null,
    accountSummary: "eFootball 2026 PS5 account, 900k GP untouched, barely played. Level 12.",
    game: "eFootball",
    platform: "PS5",
    level: 12,
    agreedPriceCents: 4_200,
    status: "awaiting_payment" as const,
    credentials: {
      loginEmail: "freshstart.ps5@example.com",
      loginPassword: "seed-pw-do-not-reuse-01",
      recoveryEmail: "",
      recoveryEmailPassword: "",
      notes: "PSN account included. Email can be changed straight away.",
    },
  },
  {
    id: "seed-deal-payment-submitted",
    reference: "ESC-8HRT5N",
    createdBy: "sami",
    createdSide: "seller" as const,
    seller: "sami",
    buyer: "yassine",
    inviteCode: null,
    accountSummary: "eFootball 2026 mobile, 5 Epics including Epic Zidane and Epic Henry. Level 35.",
    game: "eFootball",
    platform: "Mobile",
    level: 35,
    agreedPriceCents: 14_000,
    // Buyer says they paid; waiting on the admin to confirm. This is the queue
    // you will live in.
    status: "payment_submitted" as const,
    paymentMethod: "crypto" as const,
    paymentTxHash: "0x9f2c41ab77e35d8c0b1e6a4f2d93c7581ba4e0d6c3f8a172e59b4d0c8a7361f52",
    credentials: {
      loginEmail: "epicsquad.mobile@example.com",
      loginPassword: "seed-pw-do-not-reuse-02",
      recoveryEmail: "epicsquad.mail@example.com",
      recoveryEmailPassword: "seed-pw-do-not-reuse-r2",
      notes: "2FA is off. Konami ID linked, Android only.",
    },
  },
  {
    id: "seed-deal-admin-verifying",
    reference: "ESC-5WYB6C",
    createdBy: "yassine",
    createdSide: "seller" as const,
    seller: "yassine",
    buyer: "karim",
    inviteCode: null,
    accountSummary: "eFootball 2026 Xbox account, 1.4M GP stockpile. Level 21.",
    game: "eFootball",
    platform: "Xbox",
    level: 21,
    agreedPriceCents: 7_900,
    // Payment confirmed and held; you are checking the account still works.
    status: "admin_verifying" as const,
    paymentMethod: "bank_transfer" as const,
    paymentReference: "SEPA ref 88213-KM",
    credentials: {
      loginEmail: "coinstack.xbox@example.com",
      loginPassword: "seed-pw-do-not-reuse-03",
      recoveryEmail: "",
      recoveryEmailPassword: "",
      notes: "Xbox account, region EU.",
    },
  },
  {
    id: "seed-deal-completed",
    reference: "ESC-2NDJ4L",
    createdBy: "karim",
    createdSide: "buyer" as const,
    seller: "sami",
    buyer: "karim",
    inviteCode: null,
    accountSummary: "eFootball 2026 mobile starter account, level 8, 120k GP.",
    game: "eFootball",
    platform: "Mobile",
    level: 8,
    agreedPriceCents: 2_500,
    status: "completed" as const,
    paymentMethod: "crypto" as const,
    paymentTxHash: "0x41d7be2f8a03c95614e7d2b0af8365c1927de40bb5a6c3218fe7d94036ab5c17",
    credentials: {
      loginEmail: "starter.mobile@example.com",
      loginPassword: "seed-pw-do-not-reuse-04",
      recoveryEmail: "",
      recoveryEmailPassword: "",
      notes: "Handed over and confirmed.",
    },
  },
];

/**
 * How buyers are told to pay. These are placeholders — the admin edits them at
 * /admin/payment-methods before taking real money.
 */
const PAYMENT_METHODS = [
  {
    id: "seed-pm-usdt",
    method: "crypto" as const,
    label: "USDT (TRC-20)",
    sortOrder: 10,
    walletAddress: "TReplaceThisWithYourOwnTronWalletAddress",
    network: "TRON / TRC-20",
    instructions:
      "Send the exact amount to the address above on the TRC-20 network. Sending on another network will lose the funds. Paste the transaction hash below once sent.",
  },
  {
    id: "seed-pm-btc",
    method: "crypto" as const,
    label: "Bitcoin",
    sortOrder: 20,
    walletAddress: "bc1qreplacethiswithyourownbitcoinaddress",
    network: "Bitcoin mainnet",
    instructions:
      "Send the exact amount to the address above. Confirmation usually takes 10-30 minutes. Paste the transaction hash below once sent.",
  },
  {
    id: "seed-pm-bank",
    method: "bank_transfer" as const,
    label: "Bank transfer",
    sortOrder: 30,
    walletAddress: null,
    network: null,
    instructions:
      "Message the admin for current bank details, then transfer the exact amount and paste your transfer reference below.",
  },
  {
    // Proves the automatic path works before you sign with a real processor.
    // Turn it off at /admin/payment-methods before going live.
    id: "seed-pm-sandbox",
    method: "crypto" as const,
    label: "Sandbox gateway (testing only)",
    sortOrder: 90,
    walletAddress: null,
    network: null,
    isAutomatic: true,
    provider: "sandbox",
    instructions:
      "Test gateway — no real money moves. Press Pay now, then run `npm run simulate:payment <dealId>` to make the provider confirm it.",
  },
];

// ---------------------------------------------------------------------------
// Demo history — LOCAL DEVELOPMENT ONLY
// ---------------------------------------------------------------------------
//
// Enough completed deals and reviews to see the reviews wall, the trust stats
// and a profile page at realistic scale, instead of testing a layout against
// two rows.
//
// These people do not exist. The production guard at the top of this file is
// what keeps them off a live site — do not remove it.

const DEMO_TRADERS = [
  "Mehdi", "Anas", "Rayan", "Ilyas", "Sofiane", "Bilal", "Nadir",
  "Walid", "Hamza", "Zakaria", "Oussama", "Tarek", "Younes", "Adam",
  "Khalil", "Marwan", "Ayoub", "Reda", "Nassim", "Idriss", "Salim",
  "Jibril", "Farouk", "Taha", "Amir", "Bassem", "Hicham", "Youssef",
].map((name, index) => ({
  key: `demo-${index}`,
  name,
  email: `${name.toLowerCase()}@demo.pesescrow.test`,
}));

const DEMO_ACCOUNTS = [
  { summary: "eFootball 2026 mobile, 3 Legends and a 3100-rated squad. Original email included.", game: "eFootball", platform: "Mobile", level: 38, price: 12_000 },
  { summary: "eFootball 2026 PS5 account, 1.2M GP, barely played.", game: "eFootball", platform: "PS5", level: 15, price: 5_500 },
  { summary: "PES 2021 Steam account with most base Legends unlocked.", game: "PES 2021", platform: "PC", level: 66, price: 21_000 },
  { summary: "eFootball 2026 mobile, Epic Zidane and Epic Henry, 2900 rating.", game: "eFootball", platform: "Mobile", level: 33, price: 14_500 },
  { summary: "eFootball 2026 Xbox, 800k GP and a full first team.", game: "eFootball", platform: "Xbox", level: 24, price: 7_200 },
  { summary: "eFootball 2026 mobile starter, level 9, untouched coins.", game: "eFootball", platform: "Mobile", level: 9, price: 2_800 },
  { summary: "eFootball 2026 mobile, 5 Legends, squad rating 3400. No bans.", game: "eFootball", platform: "Mobile", level: 51, price: 26_000 },
  { summary: "PES 2021 PS4 account, complete Legends collection.", game: "PES 2021", platform: "PS4", level: 72, price: 18_500 },
  { summary: "eFootball 2026 PC account, 600k GP, clean history.", game: "eFootball", platform: "PC", level: 19, price: 4_900 },
  { summary: "eFootball 2026 mobile, Prime Ronaldinho maxed, 3250 rating.", game: "eFootball", platform: "Mobile", level: 44, price: 16_800 },
  { summary: "eFootball 2026 Xbox, 2M GP stockpile for squad building.", game: "eFootball", platform: "Xbox", level: 28, price: 9_400 },
  { summary: "eFootball 2026 mobile, 2 Epics and 400k GP.", game: "eFootball", platform: "Mobile", level: 22, price: 6_300 },
  { summary: "PES 2021 PC, fully trained squad, original purchase receipt.", game: "PES 2021", platform: "PC", level: 58, price: 15_200 },
];

/** Comments a buyer leaves about a seller. */
const SELLER_REVIEWS: { rating: number; comment: string }[] = [
  { rating: 5, comment: "Exactly as described. Deposited his account before I had even finished reading, which made the whole thing painless." },
  { rating: 5, comment: "Answered every question on the deal chat within minutes. Account was clean, no ban history." },
  { rating: 5, comment: "Second time buying from him. Same as the first — no messing about." },
  { rating: 4, comment: "Account was fine and matched the description. Took a day to deposit the details, that is the only reason it is not five." },
  { rating: 5, comment: "Squad was exactly what was in the screenshots. Changed the email straight away, no problems since." },
  { rating: 5, comment: "Honest about a small thing that was missing before we started, which I appreciated more than if he had hidden it." },
  { rating: 3, comment: "Account was as promised in the end but communication was slow. Had to chase twice." },
  { rating: 5, comment: "Very straightforward. Would use again." },
  { rating: 4, comment: "Good account, fair trade. Recovery email was not included even though I expected it — my fault for not asking." },
  { rating: 5, comment: "Everything checked out. The admin verifying it first is what made me comfortable handing mine over." },
  { rating: 5, comment: "GP balance was slightly higher than advertised. No complaints from me." },
  { rating: 2, comment: "Account worked but was not the level advertised. Admin sorted it and I got a partial back, so it ended fairly." },
  { rating: 5, comment: "Smooth from start to finish. Took about two hours total." },
  { rating: 4, comment: "All good. Would have liked more detail in the description up front." },
  { rating: 5, comment: "Sent the details immediately and stayed available while I changed the credentials." },
  { rating: 5, comment: "No issues at all. Legends were all there and trained as described." },
  { rating: 4, comment: "Account fine. Slight delay because he was in a different timezone, nothing serious." },
  { rating: 5, comment: "Patient with me while I worked out how the escrow worked. Genuinely helpful." },
  { rating: 3, comment: "Account was okay but a couple of players had been sold since the screenshots were taken." },
  { rating: 5, comment: "Perfect. The account had not been shared with anyone, exactly as he said." },
  { rating: 5, comment: "Fast, clear, no drama. This is how it should work." },
  { rating: 4, comment: "Happy with it. Description could have mentioned the account was region locked." },
  { rating: 5, comment: "Would buy from again without hesitating." },
  { rating: 5, comment: "Gave me the recovery email login too so I could lock it down properly." },
  { rating: 5, comment: "Told me straight away when he realised he had listed the wrong level and corrected it himself." },
  { rating: 4, comment: "Solid seller. Everything worked." },
  { rating: 5, comment: "Sent screenshots of the squad from inside the account before I committed. Nothing hidden." },
  { rating: 5, comment: "Third purchase from him. Consistent every time." },
  { rating: 4, comment: "Account matched. Deposit took a few hours because of the time difference, worth the wait." },
  { rating: 5, comment: "Explained which players were on loan contracts before I bought, which I would not have thought to ask." },
  { rating: 3, comment: "Coin balance was lower than advertised. He accepted it and the admin adjusted, so no real harm." },
  { rating: 5, comment: "Genuinely quick. Whole thing done inside an hour." },
  { rating: 5, comment: "Original email handed over with the account, which is the part most sellers try to keep." },
  { rating: 4, comment: "No complaints. Description was accurate, the swap was fair." },
  { rating: 5, comment: "Was upfront that the account had been idle for a year. Everything else was exactly right." },
  { rating: 2, comment: "Squad had been stripped since the screenshots. Admin cancelled it and returned my account, so the system worked, but be careful." },
  { rating: 5, comment: "Answered at 2am when I was mid-transfer. Did not have to." },
  { rating: 5, comment: "Clean account, no ban history, changed over without a hitch." },
  { rating: 4, comment: "Fine. Would have preferred the recovery email included but that was never promised." },
  { rating: 5, comment: "Told me exactly which device the account was bound to so I knew what I was getting into." },
  { rating: 5, comment: "Straight dealing. No pressure, no rushing me through the confirmation." },
  { rating: 3, comment: "Took three days to deposit the account. Got there eventually." },
  { rating: 5, comment: "Squad rating was actually higher than listed. Pleasant surprise." },
  { rating: 5, comment: "Understood the escrow process better than I did and walked me through it." },
  { rating: 4, comment: "Good account. Communication was brief but sufficient." },
  { rating: 5, comment: "Everything as described, and he waited until I confirmed before chasing the payout." },
  { rating: 5, comment: "Second account I have bought from him. Same standard as the first." },
  { rating: 4, comment: "All fine. Minor confusion about which platform it was on, sorted quickly." },
  { rating: 5, comment: "Sold me a very expensive account and never once made me feel rushed." },
  { rating: 5, comment: "Honest about a previous ban that had been lifted. Told me before we started, not after." },
  { rating: 4, comment: "Account was good. Would use again." },
  { rating: 5, comment: "No games, no last-minute changes to his side. Exactly what was agreed." },
  { rating: 5, comment: "Kept the account untouched from deposit to handover, which is all you can ask." },
  { rating: 3, comment: "Fine in the end but I had to ask twice for the recovery details." },
  { rating: 5, comment: "Very patient with a first-time buyer. Explained things without being condescending." },
  { rating: 5, comment: "Perfect." },
  { rating: 4, comment: "Happy overall. The level was slightly under what I expected but the squad made up for it." },
  { rating: 5, comment: "Sold exactly what he said he would. That is rarer than it should be." },
  { rating: 5, comment: "Fast deposit, clear answers, no drama at any point." },
];

/** Comments a seller leaves about a buyer. */
const BUYER_REVIEWS: { rating: number; comment: string }[] = [
  { rating: 5, comment: "Deposited within the hour and confirmed as soon as he had the account. Ideal." },
  { rating: 5, comment: "No renegotiating after we agreed the terms, which is rarer than it should be." },
  { rating: 5, comment: "Confirmed quickly so the swap closed the same day." },
  { rating: 4, comment: "Fine to deal with. Took a while to confirm after claiming it." },
  { rating: 5, comment: "Asked sensible questions before committing. Easy trade." },
  { rating: 5, comment: "Deposited exactly what he described, no messing about." },
  { rating: 3, comment: "Went quiet for two days after getting the account. Confirmed in the end." },
  { rating: 5, comment: "Straightforward buyer, knew what he wanted." },
  { rating: 5, comment: "Changed the credentials immediately and confirmed. Exactly right." },
  { rating: 4, comment: "Good buyer. Needed a bit of help understanding the confirmation step." },
  { rating: 5, comment: "Polite throughout and deposited without being chased." },
  { rating: 5, comment: "No issues. Would sell to again." },
  { rating: 5, comment: "Confirmed within twenty minutes of the release." },
  { rating: 4, comment: "All fine, slightly slow to deposit but kept me updated on the deal chat." },
  { rating: 5, comment: "Read the description properly and did not ask for anything extra afterwards." },
  { rating: 2, comment: "Tried to renegotiate after the account was already deposited. Admin held the line and it completed." },
  { rating: 5, comment: "Quick and clean." },
  { rating: 5, comment: "Confirmed straight away and left a fair review. Nothing to fault." },
  { rating: 4, comment: "Fine trade overall." },
  { rating: 5, comment: "Deposited promptly, no drama at all." },
  { rating: 5, comment: "Understood how escrow works, which made everything faster." },
  { rating: 4, comment: "Good, though he did message a lot while waiting for the admin to verify." },
  { rating: 5, comment: "Trustworthy, would deal with again." },
  { rating: 5, comment: "Everything on time." },
  { rating: 5, comment: "Deposited before I had even finished uploading mine." },
  { rating: 4, comment: "Good buyer. Asked a lot of questions but all of them were fair ones." },
  { rating: 5, comment: "Confirmed the same evening. No chasing needed." },
  { rating: 5, comment: "Knew exactly what he was buying and did not try to renegotiate afterwards." },
  { rating: 3, comment: "Deposited late and went quiet for a day, but did confirm properly in the end." },
  { rating: 5, comment: "Easy from start to finish." },
  { rating: 5, comment: "Told me the moment he had changed the credentials so I knew where we stood." },
  { rating: 4, comment: "Fine buyer. Took his time over the confirmation, which is his right." },
  { rating: 5, comment: "No issues whatsoever. Clean trade." },
  { rating: 5, comment: "Polite and quick. Would sell to again without hesitation." },
  { rating: 4, comment: "Good. Needed a bit of hand-holding through the deposit step." },
  { rating: 5, comment: "Got the Konami code across first time, which not everyone manages." },
  { rating: 5, comment: "Confirmed within the hour of release." },
  { rating: 2, comment: "Opened a dispute over something that turned out to be his own device settings. Resolved in my favour but it cost me three days." },
  { rating: 5, comment: "Read everything before committing. Made the whole thing painless." },
  { rating: 5, comment: "Straightforward and quick." },
  { rating: 4, comment: "All good. Slight delay depositing but he kept me updated." },
  { rating: 5, comment: "Serious buyer, no time wasting." },
  { rating: 5, comment: "Handled a high-value trade calmly and confirmed properly." },
  { rating: 4, comment: "No problems." },
  { rating: 5, comment: "Checked the account thoroughly before confirming, which I respect more than a rushed confirmation." },
  { rating: 5, comment: "Second time selling to him. Same as before." },
  { rating: 3, comment: "Confirmed only after the admin chased him, but he did get there." },
  { rating: 5, comment: "Deposited quickly and left a fair review. Nothing more you can ask." },
  { rating: 5, comment: "Understood that the admin verification takes time and did not badger me about it." },
  { rating: 4, comment: "Decent trade. Communication could have been a bit faster." },
  { rating: 5, comment: "No haggling, no drama, deposited and confirmed." },
  { rating: 5, comment: "Genuinely pleasant to deal with." },
  { rating: 5, comment: "Confirmed the same day and thanked me. Small thing, but it stood out." },
  { rating: 4, comment: "Fine throughout." },
  { rating: 5, comment: "Knew the process already, so everything moved fast." },
];

async function main() {
  console.log("Seeding database… (swaps are free; promoters earn $2 a deal)\n");

  // --- payment methods -----------------------------------------------------
  for (const pm of PAYMENT_METHODS) {
    const { id, ...rest } = pm;
    await prisma.paymentMethodConfig.upsert({
      where: { id },
      update: rest,
      create: { id, ...rest },
    });
  }

  console.log(`  payment methods: ${PAYMENT_METHODS.length}`);

  // --- users ---------------------------------------------------------------
  const usersByKey = new Map<string, { id: string; email: string; role: string }>();

  // The admin is seeded first and has no promoter above them — somebody has to
  // be the root of the tree, or the site could never be bootstrapped at all.
  // Everyone else is hung off them, so every seeded account has a code and a
  // referrer exactly as a real one would.
  let rootPromoterId: string | null = null;

  for (const person of PEOPLE) {
    const passwordHash = await hashPassword(person.password);
    const referredById: string | null = rootPromoterId;

    // Annotated rather than inferred. The result feeds back into
    // rootPromoterId, which is read again as this call's own argument on the
    // next iteration, and TypeScript reports that round trip as a circular
    // inference unless the type is pinned here.
    const user: { id: string; email: string; role: string } = await prisma.user.upsert({
      where: { email: person.email },
      // Re-running resets the password back to the documented fixture but
      // leaves the id and the referral code alone, so seeded deals keep their
      // parties and a code someone has already shared keeps working.
      update: { displayName: person.displayName, role: person.role, passwordHash },
      create: {
        email: person.email,
        displayName: person.displayName,
        role: person.role,
        passwordHash,
        referralCode: generateReferralCode(),
        referredById,
      },
      select: { id: true, email: true, role: true },
    });

    rootPromoterId ??= user.id;
    usersByKey.set(person.key, user);
  }

  console.log(`  users:       ${usersByKey.size}`);

  // --- deals + encrypted credentials ---------------------------------------
  const admin = usersByKey.get("admin")!;
  const now = new Date();

  // These fixtures are deliberately left as CASH deals. Nothing can create one
  // any more, but the schema still carries them and the admin console still has
  // to render them — so the seed keeps a set around to exercise that path. The
  // current flow is seeded further down, as swaps.
  for (const deal of DEALS) {
    const money = archivedSplit(deal.agreedPriceCents);

    // Timestamps are filled in only for stages the deal has actually passed.
    const paymentSubmitted = [
      "payment_submitted",
      "admin_verifying",
      "credentials_released",
      "claiming",
      "completed",
    ].includes(deal.status);

    const paymentConfirmed = ["admin_verifying", "credentials_released", "claiming", "completed"].includes(
      deal.status,
    );

    const delivered = ["credentials_released", "claiming", "completed"].includes(deal.status);
    const isCompleted = deal.status === "completed";

    const dealData = {
      reference: deal.reference,
      inviteCode: deal.inviteCode,
      inviteAcceptedAt: deal.buyer && deal.seller ? now : null,
      createdById: usersByKey.get(deal.createdBy)!.id,
      createdSide: deal.createdSide,
      sellerId: deal.seller ? usersByKey.get(deal.seller)!.id : null,
      buyerId: deal.buyer ? usersByKey.get(deal.buyer)!.id : null,
      accountSummary: deal.accountSummary,
      game: deal.game,
      platform: deal.platform,
      level: deal.level,
      // Explicit, because the column now defaults to "swap" — without this the
      // archived fixtures would be written as swaps carrying a price.
      tradeKind: "cash" as const,
      agreedPriceCents: money.agreedPriceCents,
      feeBps: money.feeBps,
      feeCents: money.feeCents,
      sellerPayoutCents: money.sellerPayoutCents,
      status: deal.status,
      paymentMethod: "paymentMethod" in deal ? deal.paymentMethod : null,
      paymentTxHash: "paymentTxHash" in deal ? deal.paymentTxHash : null,
      paymentReference: "paymentReference" in deal ? deal.paymentReference : null,
      paymentSubmittedAt: paymentSubmitted ? now : null,
      paymentConfirmedAt: paymentConfirmed ? now : null,
      paymentConfirmedById: paymentConfirmed ? admin.id : null,
      verificationStartedAt: paymentConfirmed ? now : null,
      deliveryApprovedAt: delivered ? now : null,
      deliveryApprovedById: delivered ? admin.id : null,
      credentialsReleasedAt: delivered ? now : null,
      buyerConfirmedAt: isCompleted ? now : null,
      completedAt: isCompleted ? now : null,
      payoutAt: isCompleted ? now : null,
    };

    await prisma.deal.upsert({
      where: { id: deal.id },
      update: dealData,
      create: { id: deal.id, ...dealData },
    });

    // The account login is encrypted before it ever reaches Postgres.
    if (deal.credentials) {
      const ciphertext = encryptCredentials(deal.credentials);

      await prisma.credential.upsert({
        where: { dealId_side: { dealId: deal.id, side: "seller" } },
        update: { ciphertext },
        create: { dealId: deal.id, ciphertext },
      });

      // Snapshot what was handed over, for deals that got that far.
      if (delivered) {
        await prisma.deal.update({
          where: { id: deal.id },
          data: { deliveredCiphertext: ciphertext },
        });
      }
    }
  }

  // --- demo history: completed deals and reviews ---------------------------
  //
  // Built from the pools above so the reviews wall, trust stats and profile
  // pages can be seen at realistic scale. Stable ids keep it idempotent.
  const demoUsers = new Map<string, string>();
  const demoPasswordHash = await hashPassword("Demo123!pes");

  // Spread the demo traders across the real fixture accounts as their
  // promoters, round-robin. Without this every referral page in the seed is
  // empty and there is no way to look at the programme without first building
  // a referral tree by hand.
  const promoterPool = PEOPLE.filter((person) => person.role !== "admin")
    .map((person) => usersByKey.get(person.key)!.id);

  for (const [index, trader] of DEMO_TRADERS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: trader.email },
      update: { displayName: trader.name },
      create: {
        email: trader.email,
        displayName: trader.name,
        passwordHash: demoPasswordHash,
        referralCode: generateReferralCode(),
        referredById: promoterPool[index % promoterPool.length] ?? null,
      },
      select: { id: true },
    });
    demoUsers.set(trader.key, user.id);
  }

  const demoCredentials = encryptCredentials({
    loginEmail: "demo-history@example.com",
    loginPassword: "demo-only-not-a-real-account",
    recoveryEmail: "",
    recoveryEmailPassword: "",
    notes: "Demo history fixture.",
  });

  let reviewsWritten = 0;
  const totalDemoDeals = Math.max(SELLER_REVIEWS.length, BUYER_REVIEWS.length);

  for (let i = 0; i < totalDemoDeals; i++) {
    const account = DEMO_ACCOUNTS[i % DEMO_ACCOUNTS.length];
    // Offsetting the buyer by 5 across 14 traders means seller and buyer are
    // never the same person.
    const sellerId = demoUsers.get(DEMO_TRADERS[i % DEMO_TRADERS.length].key)!;
    const buyerId = demoUsers.get(DEMO_TRADERS[(i + 5) % DEMO_TRADERS.length].key)!;

    const dealId = `demo-deal-${i}`;
    // What the other side put up. Taken from further along the same pool so
    // the two descriptions on a swap are never identical.
    const counterAccount = DEMO_ACCOUNTS[(i + 3) % DEMO_ACCOUNTS.length];

    // Spread the history back over several months so the wall does not look
    // like everything happened in one afternoon.
    const daysAgo = 3 + i * 5;
    const at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const dealData = {
      reference: `ESC-D${String(i).padStart(2, "0")}${account.platform.slice(0, 2).toUpperCase()}`,
      createdById: sellerId,
      createdSide: "seller" as const,
      sellerId,
      buyerId,
      inviteCode: null,
      inviteAcceptedAt: at,
      accountSummary: account.summary,
      counterAccountSummary: counterAccount.summary,
      game: account.game,
      platform: account.platform,
      level: account.level,
      // Swaps carry no money at all. Written explicitly rather than left to
      // the column defaults, because this is an upsert: a database seeded
      // before the cash flow was retired already has figures in these columns,
      // and a default only applies on insert. Without them a re-seed would
      // leave a swap quoting a price.
      tradeKind: "swap" as const,
      agreedPriceCents: 0,
      feeBps: 0,
      feeCents: 0,
      sellerPayoutCents: 0,
      paymentMethod: null,
      paymentSubmittedAt: null,
      paymentConfirmedAt: null,
      paymentConfirmedById: null,
      payoutAt: null,
      payoutReference: null,
      status: "completed" as const,
      verificationStartedAt: at,
      deliveryApprovedAt: at,
      deliveryApprovedById: admin.id,
      credentialsReleasedAt: at,
      deliveredCiphertext: demoCredentials,
      deliveredCounterCiphertext: demoCredentials,
      // A swap needs both confirmations to close, so both are stamped.
      buyerConfirmedAt: at,
      sellerConfirmedAt: at,
      completedAt: at,
      createdAt: at,
    };

    await prisma.deal.upsert({
      where: { id: dealId },
      update: dealData,
      create: { id: dealId, ...dealData },
    });

    // One credential row per side, which is what a swap has.
    for (const side of ["seller", "buyer"] as const) {
      await prisma.credential.upsert({
        where: { dealId_side: { dealId, side } },
        update: { ciphertext: demoCredentials },
        create: { dealId, side, ciphertext: demoCredentials },
      });
    }

    // The $2 each side owes its promoter. Written through the same path the
    // app uses, so the seed cannot drift from the real crediting rules — it
    // skips a promoter who traded in the deal, and it is idempotent on
    // re-seed.
    await creditReferralsForDeal(dealId);

    // The buyer reviews the seller...
    const sellerReview = SELLER_REVIEWS[i];
    if (sellerReview) {
      await prisma.review.upsert({
        where: { dealId_authorId: { dealId, authorId: buyerId } },
        update: { rating: sellerReview.rating, comment: sellerReview.comment },
        create: {
          dealId,
          authorId: buyerId,
          subjectId: sellerId,
          subjectSide: "seller",
          rating: sellerReview.rating,
          comment: sellerReview.comment,
          createdAt: at,
        },
      });
      reviewsWritten++;
    }

    // ...and the seller reviews the buyer. Not every deal gets both, because
    // in reality not everyone bothers.
    const buyerReview = BUYER_REVIEWS[i];
    if (buyerReview) {
      await prisma.review.upsert({
        where: { dealId_authorId: { dealId, authorId: sellerId } },
        update: { rating: buyerReview.rating, comment: buyerReview.comment },
        create: {
          dealId,
          authorId: sellerId,
          subjectId: buyerId,
          subjectSide: "buyer",
          rating: buyerReview.rating,
          comment: buyerReview.comment,
          createdAt: at,
        },
      });
      reviewsWritten++;
    }
  }

  console.log(`  demo traders: ${DEMO_TRADERS.length}`);
  console.log(`  demo deals:   ${totalDemoDeals} (completed)`);
  console.log(`  demo reviews: ${reviewsWritten}`);

  const byStatus = await prisma.deal.groupBy({ by: ["status"], _count: { _all: true } });

  console.log(`  deals:       ${DEALS.length}`);
  for (const row of byStatus) {
    console.log(`    - ${row.status}: ${row._count._all}`);
  }

  const credentialCount = await prisma.credential.count();
  console.log(`  credentials: ${credentialCount} (encrypted)\n`);

  // Sign-in details for the seeded accounts. The game-account credentials are
  // deliberately NOT printed — those are only ever read through the app, behind
  // an authorization check.
  console.log("Sign in with any of these:\n");
  console.log("  role  | email                      | password");
  console.log("  ------+----------------------------+--------------");
  for (const person of PEOPLE) {
    console.log(`  ${person.role.padEnd(5)} | ${person.email.padEnd(26)} | ${person.password}`);
  }

  console.log("\nReferral codes (paste one into the sign-up form):\n");
  for (const person of PEOPLE) {
    const code = await prisma.user.findUnique({
      where: { email: person.email },
      select: { referralCode: true },
    });

    console.log(`  ${person.email.padEnd(26)} | ${code?.referralCode ?? "—"}`);
  }

  console.log(
    `\nSwaps are free. The only money that moves is ${formatCents(REFERRAL_REWARD_CENTS)} ` +
      `per completed deal to the trader's promoter, paid on the 1st of the month.\n`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Done.");
  })
  .catch(async (error) => {
    console.error("\nSeed failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
