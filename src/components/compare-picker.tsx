"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Grade } from "@/lib/score";

export interface CompareOption {
  slug: string;
  name: string;
  grade: Grade;
}

const SELECT =
  "h-11 w-full flex-1 basis-full rounded-lg border border-line-2 bg-surface px-3 text-sm font-medium sm:basis-52";

/** Two menus that choose which associations /compare shows. A change navigates at once; the page re-renders with the new URL. */
export function ComparePicker({ options, a, b }: { options: CompareOption[]; a?: string; b?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const id = useId();

  const go = (next: { a?: string; b?: string }) => {
    const params = new URLSearchParams();
    if (next.a) params.set("a", next.a);
    if (next.b) params.set("b", next.b);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/compare?${qs}` : "/compare", { scroll: false });
    });
  };

  return (
    <div
      aria-busy={pending}
      className={`card flex flex-wrap items-center gap-x-3 gap-y-2 p-4 transition-opacity ${pending ? "opacity-70" : ""}`}
    >
      <span className="basis-full text-sm font-semibold sm:basis-auto">Compare</span>

      <label htmlFor={`${id}-a`} className="sr-only">First association</label>
      <select id={`${id}-a`} value={a ?? ""} onChange={(e) => go({ a: e.target.value, b })} className={SELECT}>
        <option value="" disabled>Choose…</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug} disabled={o.slug === b}>
            {o.name} · {o.grade}
          </option>
        ))}
      </select>

      <span className="basis-full text-sm font-semibold sm:basis-auto">with</span>

      <label htmlFor={`${id}-b`} className="sr-only">Second association</label>
      <select id={`${id}-b`} value={b ?? ""} onChange={(e) => go({ a, b: e.target.value })} className={SELECT}>
        <option value="" disabled>Choose…</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug} disabled={o.slug === a}>
            {o.name} · {o.grade}
          </option>
        ))}
      </select>
    </div>
  );
}
