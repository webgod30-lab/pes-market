"use client";

// Last-resort boundary, for errors thrown by the root layout itself.
//
// A route-level error.tsx renders *inside* the layout, so it cannot catch a
// failure in the layout. This one replaces the whole document, which is why it
// has to render its own <html> and <body> and cannot use the shared UI.
import { useEffect } from "react";

import { describeDatabaseProblemDeep } from "@/lib/db-errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error.message, error.digest ?? "");
  }, [error]);

  const dbProblem = describeDatabaseProblemDeep(error);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0b0f14",
          color: "#e7edf4",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            {dbProblem ? dbProblem.title : "Something went wrong."}
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#94a3b8" }}>
            {dbProblem
              ? dbProblem.fix
              : "The app failed to start rendering. Check the terminal running `npm run dev`."}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "#34d399",
              color: "#022c22",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
