import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getBrf } from "@/lib/data";
import { dbConfigured, listComparisons, listWatched } from "@/lib/data/saved";
import { GradeChip } from "@/components/grade";
import { DeleteComparisonButton, RemoveWatchButton } from "@/components/saved-buttons";

export const metadata: Metadata = {
  title: "Saved",
  description: "The associations you watch and the comparisons you saved.",
};

// The page itself is pre-built. Only the lists below wait for the request,
// because only they read the database.
export default function SavedPage() {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">Saved</h1>
          <p className="mt-3 max-w-2xl text-ink-2">Associations you watch and comparisons you saved.</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        <Suspense fallback={<p className="text-ink-3">Loading…</p>}>
          <SavedLists />
        </Suspense>
      </div>
    </>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

async function SavedLists() {
  // Wait for a real request, so the environment and database are read now and
  // never frozen into the build.
  await connection();

  if (!dbConfigured()) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold">Saving isn&apos;t switched on here yet.</p>
        <p className="mt-1 text-sm text-ink-2">
          The site works as before. The Watch and Save buttons appear once a database is connected.
        </p>
      </div>
    );
  }

  let watchedSlugs: string[];
  let comparisons: Awaited<ReturnType<typeof listComparisons>>;
  try {
    [watchedSlugs, comparisons] = await Promise.all([listWatched(), listComparisons()]);
  } catch {
    return (
      <div className="card p-8 text-center" role="alert">
        <p className="text-lg font-semibold">Couldn&apos;t load your saved items.</p>
        <p className="mt-1 text-sm text-ink-2">Reload the page to try again.</p>
      </div>
    );
  }

  // Names come from the data layer. An unknown slug is shown as plain text.
  const slugs = [...new Set([...watchedSlugs, ...comparisons.flatMap((c) => [c.a, c.b])])];
  const found = await Promise.all(slugs.map((s) => getBrf(s)));
  const byslug = new Map(slugs.map((s, i) => [s, found[i]] as const));
  const nameOf = (slug: string) => byslug.get(slug)?.name ?? slug;

  return (
    <div className="space-y-6">
      <section className="card" aria-labelledby="watching-heading">
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="watching-heading" className="font-semibold">
            Watching
          </h2>
          <p className="text-sm text-ink-3">{plural(watchedSlugs.length, "association", "associations")}</p>
        </div>
        {watchedSlugs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">Nothing watched yet. Use Watch on a report page.</p>
        ) : (
          <ul className="divide-y divide-line">
            {watchedSlugs.map((slug) => {
              const brf = byslug.get(slug);
              return (
                <li key={slug} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
                  <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                    {brf && <GradeChip grade={brf.assessment.grade} />}
                    <div className="min-w-0">
                      {brf ? (
                        <Link href={`/brf/${brf.slug}`} className="break-words font-semibold hover:text-brand hover:underline">
                          {brf.name}
                        </Link>
                      ) : (
                        <p className="break-words font-semibold">{slug}</p>
                      )}
                      {brf && (
                        <p className="text-sm text-ink-3">
                          {brf.district} · score {Math.round(brf.assessment.score)}
                        </p>
                      )}
                    </div>
                  </div>
                  <RemoveWatchButton slug={slug} label={`Remove ${nameOf(slug)} from watching`} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="comparisons-heading">
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="comparisons-heading" className="font-semibold">
            Saved comparisons
          </h2>
          <p className="text-sm text-ink-3">{plural(comparisons.length, "comparison", "comparisons")}</p>
        </div>
        {comparisons.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">No saved comparisons yet. Save one from the Compare page.</p>
        ) : (
          <ul className="divide-y divide-line">
            {comparisons.map((c) => {
              const title = `${nameOf(c.a)} vs ${nameOf(c.b)}`;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="break-words font-semibold">{title}</p>
                    <p className="text-sm text-ink-3">
                      Saved {c.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/compare?a=${encodeURIComponent(c.a)}&b=${encodeURIComponent(c.b)}`}
                      aria-label={`Open ${title}`}
                      className="inline-flex h-10 items-center rounded-lg border border-line-2 bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      Open
                    </Link>
                    <DeleteComparisonButton id={String(c.id)} label={`Delete saved comparison ${title}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-sm text-ink-3">Shared by everyone who has the site login.</p>
    </div>
  );
}
