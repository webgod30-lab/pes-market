# PES Escrow

A trusted-third-party service for trading game accounts (eFootball / PES), where **you, the admin,
are the middleman**.

**This is not a marketplace.** There is no shopfront, no browsing, no search. Two people have
already agreed on an account and a price somewhere else — Discord, WhatsApp, wherever they talk. They
come here only to execute that trade without either side getting robbed.

```
both parties agree the price elsewhere
   →  either party opens a Deal here and sends the invite code to the other
   →  seller deposits the account credentials (encrypted immediately)
   →  buyer pays  →  ADMIN confirms the payment, funds held in escrow
   →  ADMIN verifies the account still works
   →  ADMIN approves delivery  →  credentials released to the buyer
   →  buyer claims it (changes email + password) and confirms
   →  funds released to the seller, minus your fee
                                  └── a dispute freezes everything for you to arbitrate
```

The seller's risk is handing over an account and not getting paid. The buyer's risk is paying for an
account that does not work or gets taken back. The site removes both by holding each side's half
until the other half is proven.

---

## Build status

Built in phases. Each phase is a working app you can run and test.

| Phase | What it adds                                                        | Status            |
| ----- | ------------------------------------------------------------------- | ----------------- |
| **1** | Database schema, accounts, sign-in, seed data                       | ✅ **done**       |
| **2** | Open a deal, join by invite code, deposit the account encrypted     | ✅ **done**       |
| **3** | Payment instructions, admin payment confirmation, delivery approval | ✅ **done**       |
| **4** | Per-deal chat, reviews, disputes                                    | ✅ **done**       |
| **5** | Full admin console                                                  | ✅ **done**       |
| **6** | Automatic payment gateway + public trust area                       | ✅ **done**       |

**All six phases are built.** The service works end to end.

### What Phase 1 gives you

- Six database tables: `User`, `Deal`, `Credential`, `Message`, `Review`, `Dispute` — designed up
  front so later phases only _add_, never rewrite.
- Registration and sign-in. One account type: whether you are the buyer or the seller is decided
  **per deal**, so the same person can sell one account and buy another.
- `admin` is a separate, standing role. Nobody can register as one.
- Account credentials encrypted with AES-256-GCM before they touch the database.
- Middleman commission, configurable, snapshotted onto each deal.
- Seed data: 4 accounts and 6 deals sitting at different stages of the escrow flow.
- A read-only deal list for each party, and an admin queue showing what needs you.

### What Phase 2 adds

- **Open a deal** at `/deals/new`: pick your side, describe the account, enter the agreed price. The
  fee split is shown live as you type and locked onto the deal when you create it.
- **A single-use invite code** to send the other person. It works once; joining or cancelling
  destroys it, so a forwarded link is dead.
- **Join a deal** at `/deals/join`, or straight from the invite link. You see the exact terms — what
  is being sold, what the buyer pays, what the seller receives — before committing to anything.
- **Deposit the account**: the seller submits the login, encrypted on the way into the database. The
  seller can still correct it right up until the buyer pays, and never after.
- **A deal page** for both parties, with a progress timeline and a plain statement of whose turn it
  is.
- **Cancel**, for either party, while no money is involved.

### What Phase 3 adds

The whole escrow loop now works end to end.

- **Payment methods you configure** at `/admin/payment-methods` — crypto with a wallet address and
  network, or a manual bank/card arrangement. Deactivate rather than delete, so old deals still read
  correctly.
- **The buyer pays**: picks a method, sees the exact amount and address, and submits a transaction
  hash or reference. What they were shown is frozen onto the deal, so editing a wallet address later
  cannot muddy a dispute.
- **You confirm the money arrived** — until you do, nothing is held and nothing moves.
- **You verify the account**: reveal the credentials, log in, check it matches what was promised, and
  save a verification note that survives into any dispute.
- **You approve delivery**: the credentials are released to the buyer and the exact ciphertext
  delivered is snapshotted onto the deal. A 48-hour confirmation window starts.
- **The buyer claims and confirms**, which settles the deal. Then you record the payout to the seller.
- **Refund** at any point after payment, if it goes wrong.
- **Reminders** for buyers who go quiet — `npm run reminders`, plus a "buyers gone quiet" counter in
  the admin console.

There is still no payment gateway: you check the wallet or bank account yourself and press confirm.

### What Phase 4 adds

- **Per-deal chat** between the two parties, which you can read. Plus **internal notes** only you can
  see — your working record for a dispute.
- **Reviews** from the buyer after a completed deal, one per deal, and only once completed (a review
  written mid-deal is leverage, not information).
- **Reputation** shown where it actually matters: on the invite preview, *before* someone commits to
  a deal with a stranger. "No reviews yet" is stated plainly rather than dressed up as a neutral
  score.
- **Disputes**: either party can freeze a deal that has money in it. You get a case view with the
  complaint, both reputations, the payment record, your verification note and the whole chat — then
  resolve it for the buyer (refund) or the seller (pay out). A dispute can also be withdrawn, which
  puts the deal back exactly where it was.

### What Phase 5 adds

One console, at `/admin`, with a tab bar across every screen.

- **Overview** — every queue as a number you can click: open disputes, payments to confirm,
  deliveries to approve, payouts to send, buyers gone quiet. Ordered by how much it costs you to
  ignore it.
- **Deals** — every trade, filterable by status and searchable by reference, description or either
  person's name.
- **Disputes** — open cases, or all of them including resolved.
- **Users** — searchable, with each person's reputation, how many deals they have on each side, and
  how many are still in flight. **Ban** with a reason, and unban.
- **Overrides**: force-refund a completed deal (only before you have paid the seller — after that the
  money is genuinely gone), and force-cancel a deal that has stalled with no money in it.

Two things are deliberately impossible: banning yourself, and banning another admin. The first would
lock you out of your own console; the second means one compromised admin account cannot remove the
others.

### What Phase 6 adds

**Automatic payments.** A payment method can be switched to "automatic" at `/admin/payment-methods`,
and a provider then confirms payments over a webhook instead of you checking a wallet. The deal moves
to verification on its own; you still verify the account and approve delivery, because that is the
part a gateway cannot do.

A **sandbox provider** ships with it so the whole path works before you sign with anyone:

```bash
npm run simulate:payment <dealId>
```

**Connecting a real provider** means writing one adapter in `src/lib/payments/` — copy
`sandbox-provider.ts`, change the signature scheme and the event field names, and add it to the list
in `index.ts`. Nothing in the deal logic changes. Point the provider's webhook at
`/api/webhooks/payments/<your-provider-name>`.

> **Before you do:** mainstream processors (Stripe, PayPal) generally prohibit selling game accounts,
> because it breaches the game publisher's own terms. Realistically the card path means a high-risk
> processor, and card payments can be charged back weeks after you have released an account. Crypto
> cannot be charged back, which is why it is the safer default for this kind of trade.

**A public trust area**, which is what makes the service look like something people can rely on:

- `/reviews` — a public wall of reviews with headline numbers: average rating, deals completed, the
  share settled without a dispute, and the review count. Counted from real deals, including the ones
  that went wrong.
- `/u/<id>` — a public profile with someone's record as a seller *and* as a buyer, kept separate.
- **Reviews are mutual now.** Both sides rate each other after a completed deal, once each. A buyer
  who never pays on time is as worth knowing about as a seller who hands over a dead account.

Both pages are public and deliberately expose display names, ratings and comments only — never
emails, deal references, account descriptions or amounts.

---

## Setup

You need [Node.js](https://nodejs.org) 20 or newer. Check with `node --version`.

### 1. Get a Postgres database

**Nothing works without this.** No database means you cannot register or sign in — the app will tell
you so, but it still won't work. Pick one of the two options.

#### Option A — local, no signup (recommended to start)

Prisma ships its own local Postgres. In a **second terminal**, run:

```bash
npm run db:dev
```

Leave it running. It prints a connection string; the default is already in `.env`:

```
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
```

If your port differs, run `npx prisma dev ls` and use the **TCP** URL it shows.

> Quirk worth knowing: this local server ignores the database name in the URL — everything lands in
> one database. That is fine for development; it is not how a real Postgres behaves.

#### Option B — hosted, nothing to keep running

1. Sign up at **[neon.com](https://neon.com)** and create a project.
2. Copy the connection string and put it in `.env` as `DATABASE_URL`. It looks like:
   `postgresql://user:password@ep-something.eu-central-1.aws.neon.tech/neondb?sslmode=require`

> Two Neon notes: if `npm run db:migrate` hangs, use the **unpooled / direct** string. And a free
> Neon project **goes to sleep when idle**, so the first page load after a break can fail with "Lost
> the connection to the database" — just reload.

### 2. Check your `.env`

A `.env` already exists with a generated `AUTH_SECRET`, a `CREDENTIALS_ENCRYPTION_KEY`, and a
`DATABASE_URL` pointing at the local database from Option A. Change `DATABASE_URL` if you chose
Option B.

Starting from scratch instead? Copy the template and fill it in:

```bash
cp .env.example .env
```

Generate the two secrets it asks for (run it twice, once per key):

```bash
npm run generate:key
```

### About the seed data

`npm run db:seed` creates test accounts, deals, and **50 demo reviews across 26 completed deals** —
enough to see the reviews wall, the trust stats and a profile page at realistic scale instead of
testing a layout against two rows.

**Those people do not exist.** The seed refuses to run against anything that does not look like a
local database, because fake reviews on a live escrow site are illegal in the US (FTC), UK (DMCC Act)
and EU, and they would make the claim printed on `/reviews` — *"every review comes from a deal that
actually completed"* — a lie. Override only for a throwaway staging database:

```bash
ALLOW_REMOTE_SEED=1 npm run db:seed
```

Never run it against production. Your real numbers start at zero, and the page is built to handle
that: the trust stats only appear on the landing page once at least one deal has actually completed.

### 3. Install, migrate, seed

```bash
npm install
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

`db:migrate` creates the tables. `db:seed` fills them with test data and prints the login details.

### 4. Run it

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## Your fee

Set `DEFAULT_FEE_BPS` in `.env`. It is in **basis points**: 1 bp = 0.01%, so `500` = 5%. Use `0` to
take no fee.

The buyer always pays exactly the agreed price. Your cut comes out of the seller's payout:

| Agreed price | Fee at 5% | Seller receives |
| ------------ | --------- | --------------- |
| $185.00      | $9.25     | $175.75         |
| $42.00       | $2.10     | $39.90          |

The rate is copied onto each deal when it is created, so changing `DEFAULT_FEE_BPS` never alters the
terms of a deal already in progress.

---

## Test accounts

All created by `npm run db:seed`. Re-running the seed resets these passwords.

| Role      | Email                      | Password       |
| --------- | -------------------------- | -------------- |
| **admin** | `admin@pesescrow.test`     | `Admin123!pes` |
| user      | `sami@pesescrow.test`      | `User123!pes`  |
| user      | `yassine@pesescrow.test`   | `User123!pes`  |
| user      | `karim@pesescrow.test`     | `User123!pes`  |

Sami is the **seller** in some seeded deals and the **buyer** in others — that is the point of
per-deal sides.

### What to check

**The Phase 6 gateway and trust area:**

- [ ] As a buyer on a deal awaiting payment, pick "Sandbox gateway" → press Pay now → a payment id
      appears.
- [ ] `npm run simulate:payment <dealId> paid bad` → **401 Bad signature**. A forged webhook cannot
      mark anything paid.
- [ ] `npm run simulate:payment <dealId> paid replay` → the first confirms the deal, the second says
      "duplicate, ignored". Providers retry, and a retry must not confirm twice.
- [ ] The deal is now at "admin verifying" with no admin having touched it.
- [ ] Complete a deal, then leave a review as **both** the buyer and the seller.
- [ ] Visit `/reviews` and `/u/<id>` **signed out** → they load, and contain no emails, deal
      references, account descriptions or amounts.

**The Phase 5 console:**

- [ ] `/admin` → every queue is a number you can click through to the matching list.
- [ ] `/admin/deals` → filter by status, search by reference or a person's name.
- [ ] `/admin/users` → ban someone with a reason, then try to sign in as them → refused. Unban →
      they work again.
- [ ] Try to ban yourself, or the admin account → refused, with a reason why.
- [ ] On a completed deal that has not been paid out → force-refund is offered. After a payout is
      recorded → it is not.

**The Phase 4 flow** — trust:

- [ ] On any deal, post a message as each party → both see it, and so do you.
- [ ] As the admin, tick "internal note" and post → **view the same deal as either party and confirm
      the note is not there at all**, not merely hidden. (It is excluded by the query.)
- [ ] Complete a deal, then as the buyer leave a review → the seller's reputation updates.
- [ ] Open an invite link from that seller → their rating shows *before* you decide to join.
- [ ] On a deal with money in it, open a dispute → the deal freezes and neither side can act.
- [ ] Withdraw it → the deal returns to exactly the stage it was at.
- [ ] Open it again and resolve it as the admin → refunds the buyer or pays the seller, and the
      decision is shown to both.

**The Phase 3 flow** — the money. Continue from a deal at "waiting for payment":

- [ ] As the admin, open `/admin/payment-methods` → replace the placeholder wallet addresses with
      your own. **Do this before any real money moves**; a buyer paying a placeholder address loses
      it permanently.
- [ ] As the buyer, open the deal → pick a method, see the exact amount and address, paste a
      transaction hash, submit.
- [ ] As the admin, open the deal from `/admin` → "Payment received" → the deal moves to verifying
      and the funds count as held.
- [ ] Reveal the account details, log in for real, then save a verification note.
- [ ] Approve delivery → the buyer can now see the login, and a 48-hour clock starts.
- [ ] As the buyer, reveal the details → the deal moves to "claiming" by itself. Change the email and
      password, then confirm.
- [ ] As the admin, record the payout reference → the deal is settled.
- [ ] Check the buyer's deal page *before* revealing → nothing about the account login appears in the
      page source. It only travels when they ask for it.
- [ ] Run `npm run reminders` → it lists nobody, unless a buyer is past their deadline.

**The Phase 2 flow**, using two browsers (or one normal and one private window):

- [ ] As `sami`, open a deal at `/deals/new` → the money split updates as you type the price, and
      creating it gives you an invite code.
- [ ] As `karim` in the other window, open the invite link → you see the terms and which side you
      would be, *before* joining.
- [ ] Join → the deal becomes "waiting for account details" and both names appear.
- [ ] Open the same invite link again → "This invite is not usable". It works exactly once.
- [ ] As `sami`, deposit the account details → the deal moves to "waiting for payment".
- [ ] As `karim`, open the deal → you can see it, but nothing about the account login anywhere.
- [ ] As `yassine` (neither party), open that deal's URL → **404**.
- [ ] Try to join your own deal → refused; you cannot be both sides.
- [ ] Cancel a deal before payment → cancelled, and its invite code stops working too.

**Phase 1 basics:**

- [ ] Sign in as the admin → `/admin` shows 1 payment to confirm and 1 delivery to approve, with
      both deals listed under "Needs your attention".
- [ ] Sign in as `sami` → `/dashboard` lists deals where he is the seller *and* where he is the
      buyer, each labelled with the side he holds.
- [ ] A seller row shows what he **receives** (price minus fee); a buyer row shows what he **pays**.
- [ ] While signed in as a normal user, visit `/admin` → **404**, not the console.
- [ ] While signed out, visit `/dashboard` → redirected to `/login`, and after signing in you land
      back on `/dashboard`.
- [ ] Register a new account → signed in automatically, with an empty deal list.
- [ ] Register with an email that already exists → a clear error on the email field.
- [ ] Sign in with a wrong password → "Incorrect email or password" (it does not reveal whether the
      email exists).
- [ ] Run `npm run db:studio`, open `Credential` → every `ciphertext` is unreadable, starting `v1:`.

---

## Commands

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Start the development server on port 3000                      |
| `npm run db:dev`       | Start the local Postgres (leave running in its own terminal)   |
| `npm run build`        | Production build                                               |
| `npm run lint`         | ESLint                                                         |
| `npm run db:migrate`   | Apply schema changes to the database                           |
| `npm run db:seed`      | Insert/refresh the test data                                   |
| `npm run db:studio`    | Open Prisma Studio, a browser UI for your database             |
| `npm run db:check`     | Report which database you are on, and what is in it            |
| `npm run make:admin <email>` | Promote an existing account to admin                     |
| `npm run db:reset`     | ⚠️ Drop everything, re-migrate, re-seed                        |
| `npm run db:generate`  | Regenerate the Prisma client (runs automatically on install)    |
| `npm run test:smoke`   | Verify encryption, fee maths and validation (no database needed) |
| `npm run test:guards`  | Verify the deal authorization rules against the seeded database |
| `npm run reminders`    | Chase buyers who have not confirmed past their deadline         |
| `npm run simulate:payment <dealId>` | Act as a payment provider against the sandbox gateway |
| `npm run generate:key` | Print a fresh 32-byte hex key                                  |

`npm run test:smoke` is the fastest way to confirm the security-critical parts still work. It checks
that credentials round-trip, that a tampered ciphertext is rejected rather than silently accepted,
that no plaintext survives in the stored value, that the fee split never loses a cent, and that
nobody can register themselves as an admin.

---

## Project structure

```
prisma/
  schema.prisma          all six models — start here to understand the data
  seed.ts                test data
prisma.config.ts         Prisma 7 config (migrations + seed command)
scripts/
  smoke-test.ts          checks encryption/fees/validation without a database
  check-deal-guards.ts   checks the deal authorization rules against real data
  send-reminders.ts      chases buyers who have not confirmed (run on a schedule)
src/
  app/
    page.tsx             landing page, explains the escrow flow
    how-it-works/        the flow, step by step
    faq/                 common questions, including the awkward ones
    terms/, privacy/     legal pages (templates — see below)
    contact/             how to reach you
    reviews/, u/[id]/    public trust area
    login/, register/    auth screens
    dashboard/           your deals, on either side
    deals/new/           open a deal
    deals/join/          join by invite code (and /join/[code] from a link)
    deals/[id]/          the deal page both parties work from
    admin/               console overview — every queue (404s for everyone else)
    admin/deals/         all deals, filterable and searchable
    admin/deals/[id]/    confirm payment, verify, release, refund, pay out
    admin/disputes/      open and resolved cases
    admin/users/         search, reputation, ban and unban
    admin/payment-methods/  what buyers are told to pay to
    actions/             server actions (auth, deals, payment, admin)
    api/auth/            NextAuth endpoints
  components/            UI building blocks and the auth forms
  lib/
    prisma.ts            database client singleton
    auth.ts              NextAuth configuration
    dal.ts               ← the authorization boundary. requireUser/requireAdmin
    deals.ts             ← every deal state change, with the rules that guard it
    crypto.ts            ← AES-256-GCM for account credentials
    admin.ts             console queries, banning, and the force overrides
    disputes.ts          freezing a deal and resolving the case
    messages.ts          per-deal chat, and admin-only notes
    reviews.ts           reviews and reputation
    fees.ts              commission maths, in basis points
    deal-status.ts       status labels and whose turn it is
    ids.ts               deal references and invite codes
    passwords.ts         bcrypt hashing
    money.ts             integer-cents helpers
    validation.ts        Zod input schemas
  proxy.ts               optimistic redirects (was "middleware" before Next 16)
```

Three files are worth reading before you change anything: **`src/lib/dal.ts`** decides who may see
what, **`src/lib/crypto.ts`** protects the account logins, and **`src/lib/deals.ts`** holds every
rule about who can change a deal and when.

A note on how state changes are written in `deals.ts`: they use a conditional `updateMany` whose
WHERE clause repeats the state the change assumes — the status it expects, which side is still
empty, who owns the deal. If two requests race, the second matches zero rows and is refused rather
than overwriting the first. Read-then-check-then-write would let both through. Keep that pattern.

### How a Deal is modelled

One `Deal` is one trade. It carries the agreed price, a description of the account, the escrow state,
the payment record and the payout — there is no separate "listing", because nothing is ever
advertised.

- `createdById` + `createdSide` — who opened it and which side they took.
- `sellerId` / `buyerId` — one is set at creation; the other fills in when the invite is accepted.
- `inviteCode` — the secret the counterparty uses to join. Single-use: cleared once accepted, so a
  leaked link stops working.
- `reference` — the short public id both parties quote, e.g. `ESC-7F3K9Q`. It identifies a deal but
  grants no access to it.
- `agreedPriceCents` / `feeBps` / `feeCents` / `sellerPayoutCents` — the money, snapshotted.
- `deliveredCiphertext` — a copy of exactly what was handed over, frozen at release, so a later edit
  cannot rewrite history during a dispute.

---

## Moving the database to Neon

The local `npm run db:dev` server is convenient but unreliable — it wedges under sustained use and
reports `running` while refusing connections. Neon is free, does not do that, and is the same
database you would deploy against.

### 1. Create the database

1. Sign up at **[neon.com](https://neon.com)** and create a project. Any region near you is fine.
2. On the project dashboard, find the connection string.
3. **Choose the direct connection, not the pooled one.** Neon offers both; the pooled host has
   `-pooler` in it. At this scale the direct one is simpler and avoids migrations hanging.

It looks like:

```
postgresql://neondb_owner:PASSWORD@ep-something-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Point the app at it

In `.env`, replace `DATABASE_URL` with that string, and **comment out `SHADOW_DATABASE_URL`** — that
setting exists only for the local dev server, and leaving it set will break migrations against Neon.

```bash
# SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:51215/..."
DATABASE_URL="postgresql://neondb_owner:...@ep-something-123.../neondb?sslmode=require"
```

### 3. Confirm it connects

```bash
npm run db:check
```

It reports the host, whether migrations are applied, and what is in each table. At this point it
should say **REMOTE (hosted)** and that no migrations have been applied yet.

### 4. Create the tables

```bash
npx prisma migrate deploy
```

Then `npm run db:check` again — all five migrations should show, with every table at 0 rows.

### 5. Make yourself an admin

Start the app, register through `/register` as normal, then:

```bash
npm run make:admin you@example.com
```

Sign out and back in to pick up the role. Without an admin, nobody can confirm payments or release
accounts.

### 6. Demo data (development only)

If this Neon project is for **development**, you can load the demo history:

```bash
ALLOW_REMOTE_SEED=1 npm run db:seed
```

If it is for **production, do not.** It creates invented people and 50 fake reviews. Your real
numbers start at zero and the site is built to look fine that way.

### Notes

- **Your existing local data does not come with you.** Almost all of it is seed and demo fixtures,
  so a clean start is usually what you want. Ask if you need the real rows copied across.
- **Keep `CREDENTIALS_ENCRYPTION_KEY` unchanged** if you ever copy encrypted credentials between
  databases — they are unreadable with a different key.
- A free Neon project sleeps when idle, so the first request after a pause can fail with "Lost the
  connection to the database". Reload. The app already recognises this and says so.
- Use a **separate Neon project** for production, never the same one as development.

---

## Going live: hosting and a domain

### 1. A domain

Buy it at a registrar — [Cloudflare](https://www.cloudflare.com/products/registrar/) (at cost, no
markup), [Porkbun](https://porkbun.com) or [Namecheap](https://www.namecheap.com) are all fine. Avoid
the "free domain" bundled with cheap hosting; you usually cannot move it.

`pesescrow.com` had no DNS records when this was written, which *suggests* it is unregistered — but
that is not proof. Check it at a registrar, and have a second choice ready.

A `.com` reads as more legitimate than `.xyz` or `.online` for something handling other people's
money. That perception is worth more than the few dollars saved.

### 2. Hosting

**Vercel** is the natural fit — it is built by the Next.js team, deploys straight from GitHub, and
the free tier is enough to start.

1. Push this project to a GitHub repository.
2. At [vercel.com](https://vercel.com), *Add New → Project* and import it.
3. Set the **Build Command** to `npm run vercel-build`. That runs `prisma migrate deploy` before
   building, so your database schema is applied on every deploy.
4. Add the environment variables below.
5. Deploy, then *Settings → Domains* and add your domain. Vercel shows you the DNS records to add at
   your registrar, and issues the HTTPS certificate automatically.

### 3. Production environment variables

Set these in Vercel, **not** in a committed file:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | **A fresh one.** Never reuse the development secret |
| `AUTH_URL` | `https://yourdomain.com` — must match exactly, or sign-in breaks |
| `CREDENTIALS_ENCRYPTION_KEY` | A fresh 64-hex key — **back it up before deploying** |
| `DEFAULT_FEE_BPS` | e.g. `500` for 5% |
| `PAYMENTS_WEBHOOK_SECRET` | A fresh long random string |

Leave `SHADOW_DATABASE_URL` unset in production — that is only for the local dev database.

Generate each secret with `npm run generate:key`.

> **The encryption key is the one that cannot be recovered.** If you lose it, every credential in the
> database becomes permanently unreadable — including accounts sitting in open deals. Store it in a
> password manager before you deploy, not after.

### 4. After the first deploy

1. Seed an admin account, or register normally and set `role` to `admin` in the database.
2. `/admin/payment-methods` → replace the placeholder wallet addresses with your own.
3. **Turn off "Sandbox gateway (testing only)"** — it confirms payments without any money moving.
4. Fill in `src/lib/site.ts` (see below) and redeploy.
5. Set up email at your domain so `contact@yourdomain.com` actually receives mail — Cloudflare Email
   Routing forwards to a normal inbox for free.
6. Schedule `npm run reminders` (Vercel Cron, or any scheduler) so silent buyers get chased.

---

## Before you go live: fill in your details

Open **`src/lib/site.ts`** and replace the placeholders — your support email, Discord or Telegram,
and the name of the person or company operating the service. The terms and privacy pages reference
these, and both show a visible warning banner until they are filled in.

**The legal pages are templates, not legal advice.** They accurately describe what this software
actually does with data and money, which is the part most generated policies get wrong — but they
still need review by someone who knows the law where you operate. Privacy law differs meaningfully
between the EU, UK, US and elsewhere.

---

## Security notes

**`CREDENTIALS_ENCRYPTION_KEY` is not recoverable.** If you lose it or change it, every credential
already in the database becomes permanently unreadable. Back it up somewhere safe, keep it out of
git, and use a _different_ key in production.

Rules the code follows, and that you should keep following:

- Credentials are encrypted before insert and decrypted only behind an authorization check.
- Credentials are never logged. Prisma query logging is deliberately turned off, because query logs
  would print the ciphertext on every read.
- The buyer cannot see credentials until the admin approves delivery on that deal. The deal page
  does not select the ciphertext at all, so it never reaches a page payload — verified by scanning
  the buyer's raw server response for it.
- The seller cannot swap the account after the buyer has sent payment. Changing the credentials once
  someone has paid is the exact scam this service exists to prevent.
- A non-party gets a 404 on a deal, not a "forbidden" page, so deal ids cannot be probed.
- Invite codes are single-use and are destroyed on join *and* on cancel, so a forwarded link is dead.
- Nobody can be both sides of the same deal.
- Credentials are only decrypted for the admin verifying the account, and for the buyer after
  delivery is approved. Both are behind an explicit button, so the details are never part of the
  default page payload.
- Delivery approval snapshots the exact ciphertext handed over onto the deal, so a later change to
  the seller's credential row cannot rewrite what the buyer actually received.
- The buyer reads that snapshot, not the live credential row.
- What the buyer was told to pay is frozen onto the deal when they submit. Editing a wallet address
  afterwards cannot change the record of what was on screen.
- Only the admin can confirm a payment, approve delivery, refund, or record a payout — verified by
  `npm run test:guards`, which calls those functions directly as a non-admin.
- Admin notes are filtered out in the database query, not hidden in the UI, so they cannot leak
  through a page payload. The guard checks assert the note text is absent from what a party receives.
- A dispute freezes the deal and records the status it came from, so withdrawing restores it exactly.
- A ban takes effect on the banned person's next request, because the DAL re-reads the user row
  instead of trusting the session token. Verified by banning an account and failing to sign in as it.
- An admin cannot ban themselves or another admin.
- A deal whose payout has already been sent cannot be force-refunded — there is nothing left to
  reverse, and pretending otherwise would misreport where the money is.
- Payment webhooks are verified before anything else happens, with a constant-time comparison, and an
  unsigned request is rejected outright. Verified by sending a forged signature and getting a 401.
- Webhook deliveries are idempotent: the provider's event id is stored behind a unique index, so a
  retry cannot confirm a payment twice. Verified by sending the same event twice.
- An underpayment never settles a deal. It is recorded and left for you, because crypto frequently
  arrives short when the sender pays the network fee out of the amount.
- The public trust pages expose display names, ratings and comments only.
- Every dispute is kept. A deal can be disputed again after a withdrawal, and the earlier case stays
  on record — overwriting it would destroy the evidence you would need to judge the next one.

### A word on the money

There is no payment gateway. Nothing in this app can move funds. A "payment" is the buyer telling
you they sent money, and "confirmed" means **you** looked at your wallet or bank account and pressed
a button. Escrow here is a promise you keep, backed by the fact that neither the account nor the
money is released without your action.

Replace the seeded placeholder wallet addresses before taking real money.
- Authorization is enforced inside each page through `src/lib/dal.ts`, which re-reads the user from
  the database. `src/proxy.ts` only does a cosmetic redirect — it is not a security boundary, and
  Next.js documentation explicitly warns against relying on it for one.
- A ban takes effect on the next request, not when the session expires, for the same reason.
- Passwords are bcrypt-hashed with cost 12. Failed logins burn matching time so an attacker cannot
  discover which emails are registered by timing the response.
- Money is stored as whole cents and the fee is split so the parts always add back to the price
  exactly. No floats anywhere near a balance.

---

## Troubleshooting

**`npm install` says "packages have install scripts not yet covered by allowScripts"**
npm 11.16+ blocks dependency install scripts until approved. Prisma needs its script to fetch the
schema engine. The approvals are already recorded in `package.json` under `allowScripts`; if you see
the warning for a new package, run `npm approve-scripts <package-name>`.

**"The database is not reachable" when signing in or registering**
Nothing is listening at `DATABASE_URL`. Start the local database with `npm run db:dev` in a second
terminal, or fix `DATABASE_URL` in `.env`. Then run `npm run db:migrate`.

**"The database has no tables yet"**
The database is reachable but empty — you skipped the migration. Run `npm run db:migrate`, then
`npm run db:seed`.

**"Lost the connection to the database"**
Usually a sleeping free-tier database (Neon suspends idle projects). Reload the page.

If it keeps happening on the **local** `npm run db:dev` database, that server can wedge under sustained
use — it still reports `running` while resetting every connection. Restart it:

```bash
npx prisma dev stop pes-escrow
```

```bash
npx prisma dev start pes-escrow
```

Your data survives. If it happens often, switch to a hosted database (Option B in Setup).

**`Error: DATABASE_URL is not set`**
There is no `.env`, or it has no `DATABASE_URL`. See step 2.

**`npm run db:migrate` hangs**
Use Neon's unpooled/direct connection string.

**I signed in fine yesterday, now I'm logged out**
Re-running `npm run db:seed` after a reset gives the seeded accounts new ids, which invalidates any
existing session. Sign in again.

**`Could not decrypt credentials`**
`CREDENTIALS_ENCRYPTION_KEY` is not the key those rows were written with. Restore the original key,
or `npm run db:reset` to start over with the current one.

**Every page suddenly returns 404, even the home page**
The `.next` cache is in a mixed state — usually from running `npm run build` while `npm run dev`
was using the same folder. Stop the dev server, delete `.next`, and start it again.

**`Cannot find module '../../src/app/.../page.js'` when typechecking**
Stale Next.js route types after deleting a page. Delete the `.next` folder and try again.

**Prisma errors mentioning `datasource property url`**
In Prisma 7 the connection URL lives in `prisma.config.ts` and in the driver adapter, not in
`schema.prisma`. This project is already set up that way.
