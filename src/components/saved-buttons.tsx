"use client";

import { useActionState } from "react";
import { removeComparison, toggleWatch } from "@/app/actions";

const BUTTON =
  "h-10 whitespace-nowrap rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-60";

/** Stop watching an association. `label` names it for screen readers. */
export function RemoveWatchButton({ slug, label }: { slug: string; label?: string }) {
  const [state, formAction, pending] = useActionState(toggleWatch, null);
  return (
    <form action={formAction} className="flex flex-col items-start">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="watch" value="0" />
      <button type="submit" disabled={pending} aria-busy={pending} aria-label={label} className={BUTTON}>
        Remove
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="text-xs text-down">
          {state.message}
        </p>
      )}
    </form>
  );
}

/** Delete a saved comparison. `id` is the row id as a string. */
export function DeleteComparisonButton({ id, label }: { id: string; label?: string }) {
  const [state, formAction, pending] = useActionState(removeComparison, null);
  return (
    <form action={formAction} className="flex flex-col items-start">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} aria-busy={pending} aria-label={label} className={BUTTON}>
        Delete
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="text-xs text-down">
          {state.message}
        </p>
      )}
    </form>
  );
}
