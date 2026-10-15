"use client";

import { useRef, useState } from "react";
import { extractRatios, type Extracted, type RatioKey } from "@/lib/report-parse";

const RATIO_COUNT = 6;

type State =
  | { kind: "idle" }
  | { kind: "reading"; page: number; total: number; file: string }
  | { kind: "done"; ex: Extracted; file: string }
  | { kind: "error"; message: string; file?: string };

/** Reads the key ratios out of an annual-report PDF, on the device, and hands them to the form. */
export function ReportUpload({ onRead }: { onRead: (ex: Extracted) => void }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function read(file: File) {
    setState({ kind: "reading", page: 0, total: 0, file: file.name });
    try {
      const { readPdfText, ReportError } = await import("@/lib/report-pdf");
      try {
        const items = await readPdfText(file, (page, total) => setState({ kind: "reading", page, total, file: file.name }));
        const ex = extractRatios(items);
        if (!ex.hasText) {
          setState({
            kind: "error",
            file: file.name,
            message:
              "This PDF is a scanned image, so there's no text to read. Type the numbers in by hand from the Flerårsöversikt table.",
          });
          return;
        }
        if (Object.keys(ex.ratios).length === 0) {
          setState({
            kind: "error",
            file: file.name,
            message:
              "No key ratios found. Reports for years before 2023 don't have them. Look for a table called Flerårsöversikt or Nyckeltal and type the numbers in.",
          });
          return;
        }
        onRead(ex);
        setState({ kind: "done", ex, file: file.name });
      } catch (e) {
        setState({ kind: "error", file: file.name, message: e instanceof ReportError ? e.message : "Something went wrong reading the PDF." });
      }
    } catch {
      setState({ kind: "error", file: file.name, message: "The PDF reader couldn't load. Check your connection and try again." });
    }
  }

  const choose = () => input.current?.click();

  return (
    <div
      className={`card p-5 transition-colors sm:p-6 ${over ? "border-brand bg-brand-tint" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) read(file);
      }}
    >
      <input
        ref={input}
        id="report-file"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) read(file);
          e.target.value = "";
        }}
      />

      {state.kind === "idle" && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Fill the form from the annual report</h2>
            <p className="mt-1 text-sm text-ink-2">
              Drop the PDF here or choose it. It&apos;s read on your device and never uploaded. Most listings link the
              årsredovisning, or the estate agent can send it.
            </p>
          </div>
          <button
            type="button"
            onClick={choose}
            className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-ink"
          >
            Choose PDF
          </button>
        </div>
      )}

      {state.kind === "reading" && (
        <div aria-live="polite">
          <p className="text-sm font-semibold">Reading {state.file}</p>
          <p className="mt-1 text-sm text-ink-2 tabular">
            {state.total ? `Page ${state.page} of ${state.total}` : "Opening the file"}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${state.total ? (state.page / state.total) * 100 : 5}%` }}
            />
          </div>
        </div>
      )}

      {state.kind === "done" && <Summary ex={state.ex} file={state.file} onAgain={choose} />}

      {state.kind === "error" && (
        <div aria-live="polite" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-down">Couldn&apos;t read {state.file ?? "the file"}</p>
            <p className="mt-1 text-sm text-ink-2">{state.message}</p>
          </div>
          <button
            type="button"
            onClick={choose}
            className="h-9 shrink-0 rounded-lg border border-line-2 px-3.5 text-sm font-medium hover:border-ink"
          >
            Try another PDF
          </button>
        </div>
      )}
    </div>
  );
}

function Summary({ ex, file, onAgain }: { ex: Extracted; file: string; onAgain: () => void }) {
  const found = Object.keys(ex.ratios) as RatioKey[];
  const all = found.length === RATIO_COUNT;
  const who = [ex.name, ex.orgNr, ex.year && `annual report ${ex.year}`].filter(Boolean).join(" · ");
  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            <span className={all ? "text-up" : "text-warn"}>
              Found {found.length} of {RATIO_COUNT} key ratios
            </span>
            {who && <span className="font-normal text-ink-2"> in {who}</span>}
          </p>
          <p className="mt-1 truncate text-xs text-ink-3">{file}</p>
        </div>
        <button type="button" onClick={onAgain} className="text-sm font-medium text-brand hover:underline">
          Choose another PDF
        </button>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink-2">
        <li>Check each number against the report. The page it came from is shown under each field.</li>
        {!all && <li className="text-warn">Fields marked “Not found” need typing in by hand.</li>}
        {ex.debtIsPerFlatArea && (
          <li>
            The report only gave debt per m² of flat area, which is a bit higher than debt per m² of total area. The
            grade may come out slightly worse than it should.
          </li>
        )}
        <li>
          Building details come from the report text where it mentions them. Land is set to{" "}
          {ex.tomtratt ? "tomträtt because the report lists ground rent (tomträttsavgäld)" : "äganderätt because the report doesn't list ground rent"}. Check
          these, and the maintenance plan and äkta förening switches.
        </li>
      </ul>
    </div>
  );
}
