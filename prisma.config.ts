// Prisma 7 configuration.
// Note: Prisma 7 no longer loads .env automatically — hence `dotenv/config`.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// `prisma migrate dev` replays every migration into a scratch "shadow" database
// to detect drift. Normally Prisma creates one automatically — but the local
// `npm run db:dev` server maps every database name to the same database, so the
// shadow would be the real database and the replay fails with "type Role already
// exists". Pointing it at the dedicated shadow port fixes that.
//
// Leave SHADOW_DATABASE_URL unset for a hosted database like Neon; Prisma will
// create and drop its own shadow database.
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
