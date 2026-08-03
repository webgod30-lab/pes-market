// Proves the sign-in limiter cannot be walked around.
//
// /api/auth/callback/credentials is a public endpoint. It reaches authorize()
// without going anywhere near the sign-in server action, so a limiter placed
// in the action protects only people using the form — which is nobody an
// attacker cares about. This fires attempts straight at the endpoint.
//
// Needs the dev server running, so it is not part of the default suite:
//   npm run dev
//   npm run test:bypass
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const BASE = "http://localhost:3000";
const EMAIL = "bypass-probe@example.invalid";

async function csrf() {
  const res = await fetch(`${BASE}/api/auth/csrf`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const { csrfToken } = (await res.json()) as { csrfToken: string };
  return { cookie, csrfToken };
}

async function main() {
  await prisma.rateLimitBucket.deleteMany({ where: { key: { contains: EMAIL } } });

  const { cookie, csrfToken } = await csrf();
  const outcomes: string[] = [];

  for (let i = 1; i <= 14; i++) {
    const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ csrfToken, email: EMAIL, password: `wrong-${i}` }),
    });
    const location = res.headers.get("location") ?? "";
    const code = /code=([a-z_]+)/.exec(location)?.[1] ?? (location.includes("error") ? "error" : "?");
    outcomes.push(code);
  }

  console.log("attempt outcomes:", outcomes.join(" "));
  const limited = outcomes.filter((o) => o === "rate_limited").length;
  console.log(`\nrefused by the limiter: ${limited} of 14`);
  console.log(limited > 0 ? "PASS — the raw endpoint is limited" : "FAIL — the bypass is still open");

  await prisma.rateLimitBucket.deleteMany({ where: { key: { contains: EMAIL } } });
}

main().catch((e) => console.error(e.message)).finally(() => prisma.$disconnect());
