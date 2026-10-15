"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveComparison } from "@/app/actions";

/**
 * "Save this comparison" on the compare page. A plain form. `saved` comes from
 * the server and is the truth after any
 * refresh; the action's own answer covers the moment right after pressing.
 */
export function SaveComparison({ a, b, saved }: { a: string; b: string; saved: boolean }) {
  const [state, formAction, pending] = useActionState(saveComparison, null);
  const isSaved = saved || (state?.ok === true && state.saved === true);

  if (isSaved) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 items-center rounded-lg border border-up bg-up-tint px-3.5 text-sm font-semibold text-up">
          <span aria-hidden="true">✓&nbsp;</span>Saved
        </span>
        <Link href="/saved" className="text-sm font-medium text-brand hover:underline">
          View saved
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="a" value={a} />
      <input type="hidden" name="b" value={b} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-10 whitespace-nowrap rounded-lg border border-line-2 bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        <span aria-hidden="true">☆&nbsp;</span>Save this comparison
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="text-xs text-down">
          {state.message}
        </p>
      )}
    </form>
  );
}
