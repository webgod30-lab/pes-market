// NextAuth's own endpoints (sign-in POST, sign-out, session, CSRF).
// Everything is configured in src/lib/auth.ts.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
