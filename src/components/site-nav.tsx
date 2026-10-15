"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Associations", short: "Index", match: (p: string) => p === "/" || p.startsWith("/brf") },
  { href: "/compare", label: "Compare", match: (p: string) => p.startsWith("/compare") },
  { href: "/saved", label: "Saved", match: (p: string) => p.startsWith("/saved") },
  { href: "/analyse", label: "Analyse a report", short: "Analyse", match: (p: string) => p.startsWith("/analyse") },
  { href: "/method", label: "Method", match: (p: string) => p.startsWith("/method") },
];

function Links({ pathname }: { pathname: string | null }) {
  return (
    <>
      {LINKS.map((l) => {
        const active = pathname != null && l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-full items-center whitespace-nowrap text-sm transition-colors ${
              active
                ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {"short" in l ? (
              <>
                <span className="sm:hidden">{l.short}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </>
            ) : (
              l.label
            )}
          </Link>
        );
      })}
    </>
  );
}

export function SiteNav() {
  return <Links pathname={usePathname()} />;
}

/** Rendered while the pathname is unknown (dynamic routes during prerender). */
export function SiteNavFallback() {
  return <Links pathname={null} />;
}
