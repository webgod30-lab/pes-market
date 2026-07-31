// Teaches TypeScript about the extra fields we put on the session and token,
// so `session.user.role` is typed as Role instead of being an error.
import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  /** Returned by the Credentials `authorize()` callback. */
  interface User {
    role: Role;
  }
}

// The JWT interface is declared in "@auth/core/jwt"; "next-auth/jwt" only
// re-exports it. Augmenting the re-export would define a separate, unused
// interface — so the augmentation has to target @auth/core/jwt to merge.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
