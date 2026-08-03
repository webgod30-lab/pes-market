// Prisma client singleton.
//
// Next.js hot-reloads modules in dev, which would otherwise open a new
// connection pool on every save until Postgres refuses connections. Stashing
// the client on `globalThis` keeps exactly one pool alive.
//
// Prisma 7 requires an explicit driver adapter — `new PrismaClient()` with no
// adapter throws.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and paste your Postgres connection string.",
    );
  }

  // Pool settings matter more than they look.
  //
  // Postgres servers close connections that have been sitting idle — hosted
  // databases like Neon suspend entirely — and an unconfigured pool happily
  // hands out a socket the server already dropped, which surfaces as "Server
  // has closed the connection" on a perfectly healthy database.
  //
  // The fix for that is recycling idle connections, but the first attempt set
  // this to one second, which was far too aggressive: every brief gap between
  // queries tore a connection down and built a new one, and the local wasm
  // Postgres fell over under the churn several times an hour. Thirty seconds
  // is comfortably under every provider's idle cutoff while leaving a normal
  // page render on a single connection throughout.
  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    // Fail fast rather than hanging a page render on an unreachable database.
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

  return new PrismaClient({
    adapter,
    // Deliberately no "query" logging: query logs would print the encrypted
    // credential ciphertext into the terminal on every read.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
