// Chases buyers who have been given an account but have not confirmed.
//
// Run it on a schedule (Windows Task Scheduler, cron, or a hosted cron job):
//
//   npm run reminders
//
// There is no email provider wired up in this build, so a "reminder" is
// recorded and printed rather than sent. `lastReminderSentAt` is what stops the
// same buyer being chased every time the script runs — swap the console.log for
// your mail/Telegram call when you have one, and the rest still holds.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Don't chase the same person more than once a day. */
const REMINDER_INTERVAL_HOURS = 24;

async function main() {
  const now = new Date();
  const quietSince = new Date(now.getTime() - REMINDER_INTERVAL_HOURS * 60 * 60 * 1000);

  const overdue = await prisma.deal.findMany({
    where: {
      // Released to the buyer, but they have not confirmed.
      status: { in: ["credentials_released", "claiming"] },
      confirmationDeadline: { lt: now },
      // Either never reminded, or not reminded recently.
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: quietSince } }],
    },
    select: {
      id: true,
      reference: true,
      confirmationDeadline: true,
      lastReminderSentAt: true,
      buyer: { select: { email: true, displayName: true } },
      seller: { select: { displayName: true } },
    },
  });

  if (overdue.length === 0) {
    console.log("No buyers need chasing.");
    await prisma.$disconnect();
    return;
  }

  console.log(`${overdue.length} buyer(s) past their confirmation deadline:\n`);

  for (const deal of overdue) {
    const hoursLate = deal.confirmationDeadline
      ? Math.floor((now.getTime() - deal.confirmationDeadline.getTime()) / (60 * 60 * 1000))
      : 0;

    // Never log the credentials — only who to chase and about what.
    console.log(
      `  ${deal.reference}  ${deal.buyer?.displayName ?? "buyer"} <${deal.buyer?.email ?? "?"}>  ` +
        `${hoursLate}h past deadline` +
        (deal.lastReminderSentAt
          ? `  (last reminded ${deal.lastReminderSentAt.toISOString()})`
          : "  (never reminded)"),
    );

    // TODO: send a real message here.
    await prisma.deal.update({
      where: { id: deal.id },
      data: { lastReminderSentAt: now },
    });
  }

  console.log(
    `\nRecorded ${overdue.length} reminder(s). These deals are flagged "buyer overdue" in /admin.`,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Reminder run failed:");
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
