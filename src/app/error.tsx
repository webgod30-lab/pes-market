"use client";

// Error boundary for the whole app.
//
// Its main job is the setup case: if the database is unreachable or has never
// been migrated, say so and give the exact command to fix it, instead of showing
// a blank "something went wrong".
import { useEffect } from "react";

import { describeDatabaseProblemDeep } from "@/lib/db-errors";
import { Button, Card } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side details are stripped from `error` in production; the digest is
    // the key for finding the real stack trace in the server logs.
    console.error("Page error:", error.message, error.digest ?? "");
  }, [error]);

  const dbProblem = describeDatabaseProblemDeep(error);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        {dbProblem ? (
          <>
            <h1 className="text-lg font-semibold">{dbProblem.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{dbProblem.fix}</p>
            <p className="mt-4 text-xs text-[var(--muted)]">
              This is a setup problem, not a bug in your account. See the Setup section of the
              README.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Something went wrong.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              The page failed to load. Try again — if it keeps happening, check the terminal running
              `npm run dev` for the error.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-[var(--muted)]">ref: {error.digest}</p>
            ) : null}
          </>
        )}

        <div className="mt-5">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </div>
  );
}
