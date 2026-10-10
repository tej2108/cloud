"use client";

import { useSearchParams } from "next/navigation";

/** "Grading Brf X" banner when the user arrives from a lookup with no match. */
export function AnalyseTarget() {
  const brf = useSearchParams().get("brf")?.trim().slice(0, 120);
  if (!brf) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand-tint px-4 py-3 text-sm">
      <p>
        Grading <strong className="font-semibold">{brf}</strong>. Copy the key ratios from its annual report into
        the form below.
      </p>
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(`"${brf}" årsredovisning`)}`}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-brand hover:underline"
      >
        Find its annual report ↗
      </a>
    </div>
  );
}
