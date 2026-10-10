import { GRADES, type Grade } from "@/lib/score";

export const gradeColor = (g: Grade) => `var(--g-${g.toLowerCase()})`;
const darkText = (g: Grade) => g === "C" || g === "D";

const ARROW = "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)";

/** Small energy-label style arrow with the grade letter. */
export function GradeChip({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const dims = {
    sm: "h-6 w-10 text-sm pl-2",
    md: "h-8 w-13 text-lg pl-2.5",
    lg: "h-14 w-22 text-4xl pl-4",
  }[size];
  return (
    <span
      aria-label={`Grade ${grade}`}
      className={`inline-flex shrink-0 items-center font-display ${dims} ${darkText(grade) ? "text-ink" : "text-white"}`}
      style={{ background: gradeColor(grade), clipPath: ARROW }}
    >
      {grade}
    </span>
  );
}

/** The A–G ladder from a Swedish energideklaration, with a marker on the active grade. */
export function GradeLadder({ grade, score }: { grade: Grade; score: number }) {
  return (
    <div className="w-full" role="img" aria-label={`Grade ${grade}, score ${score} of 100`}>
      <div className="flex flex-col gap-1">
        {GRADES.map((g, i) => {
          const active = g === grade;
          return (
            <div key={g} className="flex items-center gap-3">
              <div
                className={`grow-x flex h-7 items-center pl-2.5 font-display text-lg ${darkText(g) ? "text-ink" : "text-white"} ${active ? "" : "opacity-35"}`}
                style={{
                  width: `${46 + i * 7}%`,
                  background: gradeColor(g),
                  clipPath: ARROW,
                  ["--i" as string]: i,
                }}
              >
                {g}
              </div>
              {active && (
                <div className="reveal flex items-center" style={{ ["--i" as string]: 6 }}>
                  <span
                    className="flex h-9 items-center gap-2 bg-ink pl-5 pr-3 text-paper"
                    style={{ clipPath: "polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)" }}
                  >
                    <span className="font-display text-2xl leading-none">{g}</span>
                    <span className="font-mono text-xs opacity-80">{score}/100</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
