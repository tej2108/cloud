"use client";

import { useEffect, useState } from "react";

/** Sticky in-page tabs that highlight the section currently in view. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-16 z-30 border-b border-line bg-surface/95 backdrop-blur" aria-label="Sections">
      <div className="no-scrollbar mx-auto flex h-12 max-w-[1200px] gap-6 overflow-x-auto px-4 sm:px-6">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`relative flex shrink-0 items-center text-sm transition-colors ${
              active === s.id
                ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
