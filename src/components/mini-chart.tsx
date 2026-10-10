/** Small bar chart for a five-year series. Pure SVG, no client JS. */
export function MiniChart({
  title,
  sv,
  points,
  format,
  color = "var(--ink)",
}: {
  title: string;
  sv: string;
  points: { label: string; value: number }[];
  format: (n: number) => string;
  color?: string;
}) {
  const W = 260;
  const H = 110;
  const pad = 18;
  const max = Math.max(...points.map((p) => p.value), 0);
  const min = Math.min(...points.map((p) => p.value), 0);
  const span = max - min || 1;
  const y = (v: number) => pad + ((max - v) / span) * (H - pad * 2);
  const zero = y(0);
  const bw = (W / points.length) * 0.56;
  const last = points[points.length - 1];
  const first = points[0];
  const change = first.value !== 0 ? (last.value / first.value - 1) * 100 : 0;

  return (
    <figure className="border-t border-ink pt-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">
          {title} <span className="font-display italic text-ink-3">{sv}</span>
        </span>
      </figcaption>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl tabular">{format(last.value)}</span>
        {first.value > 0 && last.value > 0 && (
          <span className="font-mono text-xs text-ink-3">
            {change >= 0 ? "+" : ""}
            {Math.round(change)} % since {first.label}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`${title} by year`}>
        <line x1="0" x2={W} y1={zero} y2={zero} stroke="var(--line)" />
        {points.map((p, i) => {
          const cx = (W / points.length) * (i + 0.5);
          const top = Math.min(y(p.value), zero);
          const h = Math.max(1, Math.abs(y(p.value) - zero));
          const isLast = i === points.length - 1;
          return (
            <g key={p.label}>
              <rect
                x={cx - bw / 2}
                y={top}
                width={bw}
                height={h}
                fill={p.value < 0 ? "var(--falu)" : color}
                opacity={isLast ? 1 : 0.28}
              >
                <title>{`${p.label}: ${format(p.value)}`}</title>
              </rect>
              <text x={cx} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-plex-mono)">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
