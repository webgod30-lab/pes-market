import { initialOf, type NavUser } from "@/components/nav/nav-links";
import { Badge, cn } from "@/components/ui";

/**
 * Who is signed in.
 *
 * Shared by the profile dropdown and the mobile sheet, which both show exactly
 * this — avatar, name, admin badge, email — and had it written out twice. Only
 * the surrounding frame differs, so each caller supplies its own wrapper and
 * this owns the contents.
 */
export function Identity({ user, size = "md" }: { user: NavUser; size?: AvatarSize }) {
  return (
    <>
      <Avatar name={user.displayName} size={size} />

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{user.displayName}</span>
          {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
        </p>
        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
      </div>
    </>
  );
}

export type AvatarSize = "sm" | "md" | "lg";

const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-sm",
};

/**
 * The initial, in a filled circle.
 *
 * A gradient rather than a flat tint so it reads as a deliberate mark instead
 * of a missing photograph, and aria-hidden throughout: the name it stands for
 * is always next to it or in the trigger's accessible name.
 */
export function Avatar({ name, size = "md" }: { name: string; size?: AvatarSize }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[var(--background)]",
        AVATAR_SIZES[size],
      )}
    >
      {initialOf(name)}
    </span>
  );
}
