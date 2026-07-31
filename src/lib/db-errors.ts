// Turning database failures into something a human can act on.
//
// The two mistakes that actually happen during setup are (1) no database
// running / wrong DATABASE_URL, and (2) a reachable database that has never been
// migrated, so the tables are missing. Both used to surface as an unhandled
// exception, which tells you nothing. These helpers name the problem and the fix.

export type DatabaseSetupProblem = {
  /** Short headline. */
  title: string;
  /** What to actually do about it. */
  fix: string;
};

/** Pulls a code off Prisma and raw pg errors alike. */
function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "");
}

/**
 * Returns a description of the setup problem, or null if this is not a
 * database-setup error and should be handled normally.
 */
export function describeDatabaseProblem(error: unknown): DatabaseSetupProblem | null {
  const code = errorCode(error);
  const message = errorMessage(error);

  // --- cannot reach the server at all ---
  // P1001: Prisma "can't reach database server". ECONNREFUSED/ENOTFOUND/ETIMEDOUT
  // come from the pg driver when nothing is listening or DNS fails.
  if (
    code === "P1001" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    /can'?t reach database server|ECONNREFUSED|ENOTFOUND/i.test(message)
  ) {
    return {
      title: "The database is not reachable.",
      fix: "Start a local database with `npm run db:dev`, or put a working DATABASE_URL in .env. Then run `npm run db:migrate`.",
    };
  }

  // --- server is up, but the database/schema is not set up ---
  // P1003 / 3D000: named database does not exist.
  if (code === "P1003" || code === "3D000" || /database .* does not exist/i.test(message)) {
    return {
      title: "That database does not exist yet.",
      fix: "Check the database name at the end of DATABASE_URL in .env, then run `npm run db:migrate`.",
    };
  }

  // --- tables missing: reachable database, migration never run ---
  // P2021: table does not exist. 42P01: pg "relation does not exist".
  if (
    code === "P2021" ||
    code === "P2022" ||
    code === "42P01" ||
    /relation .* does not exist|table .* does not exist/i.test(message)
  ) {
    return {
      title: "The database has no tables yet.",
      fix: "Run `npm run db:migrate` to create them, then `npm run db:seed` for test data.",
    };
  }

  // --- the connection died mid-flight ---
  // Very common with free hosted databases: Neon suspends a project after a few
  // idle minutes, so the first request afterwards gets handed a pooled socket
  // that is already dead. The next attempt reconnects, so this is "retry", not
  // "your setup is broken".
  if (
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    /connection terminated|connection closed|server closed the connection|ECONNRESET/i.test(message)
  ) {
    return {
      title: "Lost the connection to the database.",
      fix: "Free hosted databases (like Neon) go to sleep when idle. Reload the page — it normally reconnects straight away.",
    };
  }

  // --- wrong credentials ---
  // 28P01: password authentication failed.
  if (code === "28P01" || /password authentication failed/i.test(message)) {
    return {
      title: "The database rejected the username or password.",
      fix: "Check the credentials inside DATABASE_URL in .env.",
    };
  }

  // --- missing configuration ---
  if (/DATABASE_URL is not set/i.test(message)) {
    return {
      title: "DATABASE_URL is not set.",
      fix: "Copy .env.example to .env and fill in DATABASE_URL, or run `npm run db:dev` for a local database.",
    };
  }

  return null;
}

/**
 * Flattens an error and everything it wraps into a list.
 *
 * Needed because the real cause is often buried: NextAuth reports a failure
 * inside authorize() as a CallbackRouteError with the original hidden at
 * `cause.err`, and Prisma wraps driver errors in its own error types. Checking
 * only the outermost error — or only the innermost — misses the one link that
 * actually carries the code.
 */
function errorChain(error: unknown, depth = 0): unknown[] {
  const chain: unknown[] = [error];

  if (depth > 6 || typeof error !== "object" || error === null) return chain;

  const cause = (error as { cause?: unknown }).cause;

  if (!cause) return chain;

  // NextAuth's wrapper keeps the original error at `cause.err`.
  if (typeof cause === "object" && cause !== null && "err" in cause) {
    chain.push(...errorChain((cause as { err: unknown }).err, depth + 1));
  } else {
    chain.push(...errorChain(cause, depth + 1));
  }

  return chain;
}

/** Checks the error and everything it wraps. */
export function describeDatabaseProblemDeep(error: unknown): DatabaseSetupProblem | null {
  for (const link of errorChain(error)) {
    const problem = describeDatabaseProblem(link);
    if (problem) return problem;
  }

  return null;
}

/** One-line version for a form error banner. */
export function databaseProblemMessage(error: unknown): string | null {
  const problem = describeDatabaseProblemDeep(error);
  return problem ? `${problem.title} ${problem.fix}` : null;
}
