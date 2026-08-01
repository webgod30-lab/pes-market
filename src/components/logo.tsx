import Link from "next/link";

/**
 * The brand mark: a shield with a keyhole.
 *
 * Chosen to survive being 16 pixels wide in a browser tab — a solid tile with
 * two knocked-out shapes still reads at that size, where a letterform or a thin
 * outline turns to mush. The same mark is used for the header, the footer, the
 * favicon and the social preview, so it is recognisable in all of them.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="PES Escrow"
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#34d399" />
      {/* Shield: protection, and the thing being held. */}
      <path
        d="M32 12 L48 18 V32.5 C48 41.2 41.1 47.8 32 51.5 C22.9 47.8 16 41.2 16 32.5 V18 Z"
        fill="#022c22"
      />
      {/* Keyhole, knocked back out in the tile colour. */}
      <circle cx="32" cy="27.5" r="5" fill="#34d399" />
      <path d="M29.7 30.2 h4.6 l-1.2 9.3 h-2.2 z" fill="#34d399" />
    </svg>
  );
}

/** Mark plus wordmark. The name stays real text so it is selectable and indexed. */
export function LogoLockup({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex shrink-0 items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark size={size} />
      <span>
        PES<span className="text-emerald-400">Escrow</span>
      </span>
    </span>
  );
}

/** The lockup as a link home. */
export function LogoLink({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" aria-label="PES Escrow — home">
      <LogoLockup size={size} className="text-sm sm:text-base" />
    </Link>
  );
}
