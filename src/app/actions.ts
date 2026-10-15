"use server";

// Server Actions for the watchlist and saved comparisons. They take the
// (previous state, form data) shape so the UI can use useActionState and a
// plain <form action>, which also works without JavaScript.
//
// The browser is not trusted: every input is checked here, before anything is
// written. Next.js itself only accepts action calls as POST from the same
// host (it compares the Origin and Host headers), so there is no CSRF code
// here.
//
// A "use server" file may only export async functions, so the result type is
// not exported. Every action returns this shape (UI code mirrors it):
//   { ok: boolean; message?: string; watching?: boolean; saved?: boolean }
// watching comes from toggleWatch, saved from saveComparison. removeComparison
// returns only ok and message.

import { revalidatePath } from "next/cache";
import { getBrf } from "@/lib/data";
import * as saved from "@/lib/data/saved";

type ActionResult = {
  ok: boolean;
  message?: string;
  watching?: boolean;
  saved?: boolean;
};

const SLUG = /^[a-z0-9-]{1,60}$/;
const ID = /^\d{1,9}$/;

const NOT_ON = "Saving isn't switched on here yet.";
const FAILED = "Couldn't save that. Try again.";

/** A slug that is well-formed and belongs to a known association, else null. */
async function knownSlug(value: FormDataEntryValue | null): Promise<string | null> {
  if (typeof value !== "string" || !SLUG.test(value)) return null;
  return (await getBrf(value)) ? value : null;
}

// Logs only the kind of error and its short code, never the message or the
// error object: a driver error message can carry the connection string.
function logFailure(action: string, err: unknown) {
  const name = err instanceof Error ? err.name : "unknown error";
  const code = (err as { code?: unknown } | null)?.code;
  console.error(`[saved] ${action} failed: ${name}${typeof code === "string" ? ` (${code})` : ""}`);
}

// The pages that read this data do so uncached, on request, so there is no
// cache tag to expire. revalidatePath on the specific routes is the narrowest
// way to make Next.js re-render them (and the page being viewed) with fresh
// state.

export async function toggleWatch(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!saved.dbConfigured()) return { ok: false, message: NOT_ON };

  const slug = await knownSlug(formData.get("slug"));
  const watch = formData.get("watch");
  if (!slug) return { ok: false, message: "That association isn't known." };
  if (watch !== "1" && watch !== "0") return { ok: false, message: "Choose watch or stop watching." };

  const on = watch === "1";
  try {
    await saved.setWatched(slug, on);
  } catch (err) {
    logFailure("toggleWatch", err);
    return { ok: false, message: FAILED };
  }

  revalidatePath("/saved");
  revalidatePath(`/brf/${slug}`);
  return { ok: true, watching: on };
}

export async function saveComparison(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!saved.dbConfigured()) return { ok: false, message: NOT_ON };

  const a = await knownSlug(formData.get("a"));
  const b = await knownSlug(formData.get("b"));
  if (!a || !b) return { ok: false, message: "Pick two known associations." };
  if (a === b) return { ok: false, message: "Pick two different associations." };

  try {
    await saved.saveComparison(a, b);
  } catch (err) {
    logFailure("saveComparison", err);
    return { ok: false, message: FAILED };
  }

  revalidatePath("/saved");
  revalidatePath("/compare");
  return { ok: true, saved: true };
}

export async function removeComparison(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!saved.dbConfigured()) return { ok: false, message: NOT_ON };

  const raw = formData.get("id");
  if (typeof raw !== "string" || !ID.test(raw)) {
    return { ok: false, message: "That saved comparison isn't valid." };
  }

  try {
    await saved.deleteComparison(Number(raw));
  } catch (err) {
    logFailure("removeComparison", err);
    return { ok: false, message: FAILED };
  }

  revalidatePath("/saved");
  revalidatePath("/compare");
  return { ok: true };
}
