type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const SearchIcon = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const ChevronRight = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const SortIcon = ({ dir, className = "h-3 w-3" }: P & { dir: "asc" | "desc" | null }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden>
    <path d="M6 1.5 9 5H3z" fill="currentColor" opacity={dir === "asc" ? 1 : 0.25} />
    <path d="M6 10.5 3 7h6z" fill="currentColor" opacity={dir === "desc" ? 1 : 0.25} />
  </svg>
);

/** Stair-step mark: a stairwell seen from the side. */
export const Logo = ({ className = "h-7 w-7" }: P) => (
  <svg viewBox="0 0 28 28" className={className} aria-hidden>
    <rect width="28" height="28" rx="7" fill="var(--brand)" />
    <path d="M6 21h4.5v-4.5H15V12h4.5V7.5H22V21z" fill="#fff" />
  </svg>
);
