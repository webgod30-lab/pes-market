// Tells you exactly which database you are talking to and what is in it.
//
//   npm run db:check
//
// Written for moving between databases: after each step you can confirm what
// actually happened instead of guessing. It only reads.
import "dotenv/config";
import { Client } from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("✗ DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

/** Every table the app expects, so a partial migration is obvious. */
const EXPECTED_TABLES = [
  "User",
  "Deal",
  "Credential",
  "Message",
  "Review",
  "Dispute",
  "PaymentMethodConfig",
  "PaymentIntent",
  "WebhookEvent",
];

async function main() {
  let host = "unknown";
  let database = "unknown";

  try {
    const parsed = new URL(url!);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, "") || "(default)";
  } catch {
    console.error("✗ DATABASE_URL is not a valid URL.");
    process.exit(1);
  }

  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  console.log(`Connecting to ${host} …\n`);

  const client = new Client({ connectionString: url });

  try {
    await client.connect();
  } catch (error) {
    console.error(`✗ Could not connect to ${host}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}\n`);

    if (isLocal) {
      console.error("  The local database may have stopped. Start it with:");
      console.error("    npx prisma dev start pes-escrow\n");
    } else {
      console.error("  Check the connection string, and that the project is not paused.\n");
    }

    process.exit(1);
  }

  const version = await client.query("SELECT version()");
  console.log(`✓ Connected`);
  console.log(`  host:     ${host}`);
  console.log(`  database: ${database}`);
  console.log(`  kind:     ${isLocal ? "LOCAL (development)" : "REMOTE (hosted)"}`);
  console.log(`  server:   ${String(version.rows[0].version).split(" on ")[0]}\n`);

  // --- migrations ---
  const migrationTable = await client.query(
    "SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS present",
  );

  if (!migrationTable.rows[0].present) {
    console.log("✗ No migrations have been applied to this database.");
    console.log("  Run:  npx prisma migrate deploy\n");
  } else {
    const migrations = await client.query(
      "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at",
    );

    const failed = migrations.rows.filter((r) => !r.finished_at || r.rolled_back_at);

    console.log(`Migrations: ${migrations.rowCount} applied`);
    for (const row of migrations.rows) {
      const ok = row.finished_at && !row.rolled_back_at;
      console.log(`  ${ok ? "✓" : "✗"} ${row.migration_name}`);
    }

    if (failed.length > 0) {
      console.log("\n  Some migrations did not finish. Resolve them before using this database.");
    }
    console.log("");
  }

  // --- tables and row counts ---
  const missing: string[] = [];
  const counts: [string, number][] = [];

  for (const table of EXPECTED_TABLES) {
    const exists = await client.query("SELECT to_regclass($1) IS NOT NULL AS present", [
      `public."${table}"`,
    ]);

    if (!exists.rows[0].present) {
      missing.push(table);
      continue;
    }

    const count = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
    counts.push([table, count.rows[0].n]);
  }

  if (missing.length > 0) {
    console.log(`✗ Missing tables: ${missing.join(", ")}`);
    console.log("  Run:  npx prisma migrate deploy\n");
  }

  if (counts.length > 0) {
    console.log("Rows:");
    for (const [table, n] of counts) {
      console.log(`  ${table.padEnd(20)} ${n}`);
    }
    console.log("");
  }

  // --- the things people actually forget ---
  const admins = counts.find(([t]) => t === "User")
    ? await client.query(`SELECT count(*)::int AS n FROM "User" WHERE role = 'admin'`)
    : null;

  if (admins) {
    if (admins.rows[0].n === 0) {
      console.log("✗ No admin account. Nobody can confirm payments or release accounts.");
      console.log("  Create one, or promote a user:");
      console.log(`    UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';\n`);
    } else {
      console.log(`✓ ${admins.rows[0].n} admin account(s)\n`);
    }
  }

  if (!isLocal && process.env.SHADOW_DATABASE_URL) {
    console.log("⚠ SHADOW_DATABASE_URL is set but this is a hosted database.");
    console.log("  That setting is only for the local dev server — comment it out in .env,");
    console.log("  otherwise migrations will try to use a shadow database that is not there.\n");
  }

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
