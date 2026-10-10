import type { Factor } from "@/lib/score";

function tone(score: number) {
  if (score >= 75) return "var(--up)";
  if (score >= 50) return "var(--g-e)";
  return "var(--down)";
}

export function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <ol className="divide-y divide-line">
      {factors.map((f, i) => (
        <li key={f.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <span className="font-medium">{f.label}</span>
            <span className="ml-2 text-sm text-ink-3">{f.sv}</span>
          </div>
          <div className="text-right text-sm font-medium tabular">{f.display}</div>
          <div className="col-span-2 flex items-center gap-3">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="grow-x absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${f.score}%`, background: tone(f.score), ["--i" as string]: i }}
              />
            </div>
            <span className="whitespace-nowrap text-right text-xs text-ink-3 tabular">
              {Math.round(f.score)}/100 · weight {f.weight}
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
    <div className="space-y-5">
      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-up">In its favour</h3>
        {green.length ? (
          <ul className="space-y-2">
            {green.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm leading-snug">
                <span aria-hidden className="mt-0.5 font-bold text-up">+</span>
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Nothing stands out.</p>
        )}
      </div>
      <div className="border-t border-line pt-5">
        <h3 className="mb-2.5 text-sm font-semibold text-down">Watch out for</h3>
        {red.length ? (
          <ul className="space-y-2">
            {red.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm leading-snug">
                <span aria-hidden className="mt-0.5 font-bold text-down">!</span>
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
