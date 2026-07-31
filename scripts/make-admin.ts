// Promotes an existing account to admin.
//
//   npm run make:admin you@example.com
//
// Needed on a fresh database: register through the site as normal, then run
// this. Without an admin nobody can confirm payments or release accounts.
import "dotenv/config";
import { Client } from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("✗ DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npm run make:admin you@example.com");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  const found = await client.query(
    'SELECT id, "displayName", role FROM "User" WHERE lower(email) = $1',
    [email],
  );

  if (found.rowCount === 0) {
    console.error(`✗ No account with the email ${email}.`);
    console.error("  Register through the site first, then run this again.");
    await client.end();
    process.exit(1);
  }

  const user = found.rows[0];

  if (user.role === "admin") {
    console.log(`${user.displayName} <${email}> is already an admin.`);
    await client.end();
    return;
  }

  await client.query(`UPDATE "User" SET role = 'admin' WHERE id = $1`, [user.id]);

  console.log(`✓ ${user.displayName} <${email}> is now an admin.`);
  console.log("  Sign out and back in to pick up the new role.");

  await client.end();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
