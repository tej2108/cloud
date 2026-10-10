import type { Factor } from "@/lib/score";

function tone(score: number) {
  if (score >= 75) return "var(--moss)";
  if (score >= 50) return "var(--ochre)";
  return "var(--falu)";
}

export function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <ol className="divide-y divide-line">
      {factors.map((f, i) => (
        <li key={f.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 py-3.5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{f.label}</span>
              <span className="font-display italic text-ink-3">{f.sv}</span>
            </div>
          </div>
          <div className="text-right font-mono text-sm tabular">{f.display}</div>
          <div className="col-span-2 flex items-center gap-3">
            <div className="relative h-1.5 flex-1 bg-paper-2">
              <div
                className="grow-x absolute inset-y-0 left-0"
                style={{ width: `${f.score}%`, background: tone(f.score), ["--i" as string]: i }}
              />
            </div>
            <span className="w-20 text-right font-mono text-[11px] text-ink-3 tabular">
              {Math.round(f.score)} · w{f.weight}
            </span>
          </div>
          <p className="col-span-2 text-sm text-ink-2">{f.note}</p>
        </li>
      ))}
    </ol>
  );
}

export function Flags({ green, red }: { green: string[]; red: string[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="eyebrow mb-3 !text-moss">In its favour</h3>
        {green.length ? (
          <ul className="space-y-2.5">
            {green.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-snug">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-moss" />
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Nothing stands out.</p>
        )}
      </div>
      <div>
        <h3 className="eyebrow mb-3 !text-falu">Watch out for</h3>
        {red.length ? (
          <ul className="space-y-2.5">
            {red.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-snug">
                <span className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-falu" />
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">No red flags in the numbers.</p>
        )}
      </div>
    </div>
  );
}
