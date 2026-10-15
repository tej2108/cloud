"use client";

import { useActionState } from "react";
import { toggleWatch } from "@/app/actions";

type WatchResult = Awaited<ReturnType<typeof toggleWatch>>;

// A plain <form action>. It is aria-disabled (not disabled) while the action runs, so keyboard focus stays on the button.
// `watching` is the stored state and is the single source of truth: while the
// action runs we show the opposite of it (what the click is asking for), and
// the action's revalidatePath brings back a fresh `watching` in the same
// update. Nothing is kept from an earlier result, so it can't go stale.
export function WatchButton({ slug, watching }: { slug: string; watching: boolean }) {
  const [state, formAction, pending] = useActionState<WatchResult | null, FormData>(toggleWatch, null);
  const shown = pending ? !watching : watching;
  const failed = !pending && state && !state.ok ? state.message : undefined;

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="watch" value={watching ? "0" : "1"} />
      <button
        type="submit"
        aria-disabled={pending}
        aria-busy={pending}
        onClick={(e) => {
          if (pending) e.preventDefault();
        }}
        className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors aria-disabled:cursor-wait aria-disabled:opacity-70 ${
          shown ? "border-up bg-up-tint text-up" : "border-line-2 bg-surface text-ink hover:bg-surface-2"
        }`}
      >
        <span aria-hidden>{shown ? "★" : "☆"}</span>
        {shown ? "Watching" : "Watch"}
        <span className="sr-only"> this association</span>
      </button>
      {failed && (
        <p role="alert" className="mt-1.5 max-w-64 text-xs text-down">
          {failed}
        </p>
      )}
    </form>
  );
}
