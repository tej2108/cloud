import { GRADES, type Grade } from "@/lib/score";

export const gradeColor = (g: Grade) => `var(--g-${g.toLowerCase()})`;
const darkText = (g: Grade) => g === "C" || g === "D";

const ARROW = "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)";

/** Small energy-label style arrow with the grade letter. */
export function GradeChip({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const dims = {
    sm: "h-6 w-10 text-sm pl-2",
    md: "h-8 w-12 text-base pl-2.5",
    lg: "h-14 w-22 text-3xl pl-4",
  }[size];
  return (
    <span
      aria-label={`Grade ${grade}`}
      className={`inline-flex shrink-0 items-center rounded-l-[4px] font-bold ${dims} ${darkText(grade) ? "text-ink" : "text-white"}`}
      style={{ background: gradeColor(grade), clipPath: ARROW }}
    >
      {grade}
    </span>
  );
}

export type Tone = "up" | "warn" | "down";
export const gradeTone = (g: Grade): Tone => ("AB".includes(g) ? "up" : "CD".includes(g) ? "warn" : "down");

const TONE_CLASS: Record<Tone, string> = {
  up: "bg-up-tint text-up",
  warn: "bg-warn-tint text-warn",
  down: "bg-down-tint text-down",
};

/** The buyer signal as a coloured pill. */
export function SignalPill({ grade, children }: { grade: Grade; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[gradeTone(grade)]}`}>
      {children}
    </span>
  );
}

/** The A–G ladder from a Swedish energideklaration, with a marker on the active grade. */
export function GradeLadder({ grade, score }: { grade: Grade; score: number }) {
  return (
    <div className="w-full" role="img" aria-label={`Grade ${grade}, score ${score} of 100`}>
      <div className="flex flex-col gap-[3px]">
        {GRADES.map((g, i) => {
          const active = g === grade;
          return (
            <div key={g} className="flex items-center gap-2">
              <div
                className={`grow-x flex h-6 items-center pl-2 text-xs font-bold ${darkText(g) ? "text-ink" : "text-white"} ${active ? "" : "opacity-25"}`}
                style={{
                  width: `${40 + i * 7}%`,
                  background: gradeColor(g),
                  clipPath: ARROW,
                  ["--i" as string]: i,
                }}
              >
                {g}
              </div>
              {active && (
                <span
                  className="flex h-7 items-center gap-1.5 bg-ink pl-4 pr-2.5 text-white"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)" }}
                >
                  <span className="text-sm font-bold leading-none">{g}</span>
                  <span className="text-xs tabular opacity-75">{score}/100</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
