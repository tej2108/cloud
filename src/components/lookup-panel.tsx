"use client";

import Link from "next/link";
import type { Lookup } from "@/lib/lookup";
import type { Grade } from "@/lib/score";
import { GradeChip } from "./grade";
import { ChevronRight } from "./icons";

export interface Match {
  slug: string;
  name: string;
  district: string;
  grade: Grade;
  /** 0–1, from nameScore */
  score: number;
}

const BOLAGSVERKET = "https://www.bolagsverket.se";
const reportSearch = (name: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`"${name}" årsredovisning`)}`;

/** Answers whatever was pasted into the search box: a match, what a link told us, or how to grade it yourself. */
export function LookupPanel({
  lookup,
  name,
  listingName,
  setListingName,
  matches,
  areaCount,
  areaLabel,
  total,
  onClear,
}: {
  lookup: Lookup;
  name: string;
  listingName: string;
  setListingName: (v: string) => void;
  matches: Match[];
  areaCount: number;
  areaLabel?: string;
  total: number;
  onClear: () => void;
}) {
  if (lookup.kind === "empty") return null;

  if (lookup.kind === "other-url") {
    return (
      <Panel onClear={onClear}>
        <p className="text-sm">
          That&apos;s a link to <strong className="font-semibold">{lookup.host}</strong>. Paste a listing from Hemnet or
          Booli, or type the association&apos;s name.
        </p>
      </Panel>
    );
  }

  const strong = matches.filter((m) => m.score >= 0.75);

  return (
    <Panel onClear={onClear}>
      {lookup.kind === "listing" && <ListingFacts lookup={lookup} areaLabel={areaLabel} />}

      {lookup.kind === "listing" && !lookup.name && (
        <div className="mt-3">
          <p className="text-sm text-ink-2">
            {lookup.site} links don&apos;t include the association, and {lookup.site} doesn&apos;t allow other sites to
            read its listings. Open the listing, find <strong className="font-semibold text-ink">Förening</strong> in the
            facts, and type the name here.
          </p>
          <label htmlFor="listing-brf" className="sr-only">Association name from the listing</label>
          <input
            id="listing-brf"
            value={listingName}
            onChange={(e) => setListingName(e.target.value)}
            placeholder="e.g. Brf Kopparslagaren"
            className="mt-2 h-10 w-full rounded-lg border border-line-2 bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-tint"
          />
        </div>
      )}

      {name && strong.length > 0 && (
        <div className="mt-3">
          <p className="label mb-1.5">{strong.length === 1 ? "Match in the index" : "Closest matches"}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {strong.map((m) => (
              <li key={m.slug}>
                <Link href={`/brf/${m.slug}`} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2">
                  <GradeChip grade={m.grade} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold group-hover:text-brand">{m.name}</span>
                    <span className="block text-xs text-ink-3">{m.district}</span>
                  </span>
                  <span className="text-xs font-medium text-brand">Open report</span>
                  <ChevronRight className="h-4 w-4 text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {name && strong.length === 0 && <NotInIndex name={name} total={total} />}

      {!name && lookup.kind === "listing" && lookup.area && (
        <p className="mt-3 text-sm text-ink-2">
          {areaCount > 0 ? (
            <>
              We have {areaCount === 1 ? "one association" : `${areaCount} associations`} in{" "}
              {areaLabel ?? "this area"}. {areaCount === 1 ? "It's" : "They're"} in the table below.
            </>
          ) : (
            <>None of the {total} associations in the index are in this area yet.</>
          )}
        </p>
      )}
    </Panel>
  );
}

function Panel({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <div className="relative mt-3 rounded-xl border border-line bg-surface-2 p-4" aria-live="polite">
      <button
        type="button"
        onClick={onClear}
        className="absolute right-3 top-3 text-xs font-medium text-ink-3 hover:text-ink"
      >
        Clear
      </button>
      {children}
    </div>
  );
}

function ListingFacts({ lookup, areaLabel }: { lookup: Extract<Lookup, { kind: "listing" }>; areaLabel?: string }) {
  const facts = [
    lookup.propertyType,
    lookup.rooms && `${lookup.rooms} rooms`,
    areaLabel ??
      lookup.area?.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    lookup.street,
    lookup.municipality,
  ].filter(Boolean);
  return (
    <div className="pr-12">
      <p className="text-sm font-semibold">
        {lookup.site} listing
        {lookup.name && <span className="font-normal text-ink-2"> · {lookup.name}</span>}
      </p>
      {facts.length > 0 && <p className="mt-0.5 text-sm text-ink-2">{facts.join(" · ")}</p>}
      {lookup.site === "Hemnet" && lookup.area && (
        <p className="mt-0.5 text-xs text-ink-3">Read from the link. Spelling is approximate because links drop å, ä and ö.</p>
      )}
    </div>
  );
}

function NotInIndex({ name, total }: { name: string; total: number }) {
  return (
    <div className="mt-3">
      <p className="text-sm">
        <strong className="font-semibold">{name}</strong> isn&apos;t in the index. It holds {total} demo associations.
        You can still grade it from its annual report in a couple of minutes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/analyse?brf=${encodeURIComponent(name)}`}
          className="inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-sm font-semibold text-white hover:bg-brand-ink"
        >
          Grade {name.length > 28 ? "it" : name}
        </Link>
        <a
          href={reportSearch(name)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-lg border border-line-2 bg-surface px-3.5 text-sm font-medium hover:border-ink"
        >
          Find its annual report ↗
        </a>
      </div>
      <p className="mt-2 text-xs text-ink-3">
        Ask the estate agent for the latest årsredovisning, or order it from{" "}
        <a href={BOLAGSVERKET} target="_blank" rel="noreferrer" className="text-brand hover:underline">
          Bolagsverket
        </a>
        .
      </p>
    </div>
  );
}
