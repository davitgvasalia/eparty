"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { title: string; text: string };

/** The website's hero carousel: auto-advances, swipes on phones, pauses on hover. */
export default function SiteSlider({ slides, children }: { slides: Slide[]; children?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), 6000);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      <div className="grid">
        {slides.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${
              i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">{s.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#c4daff] sm:text-lg">{s.text}</p>
          </div>
        ))}
      </div>

      {children}

      {count > 1 && (
        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-[#4fe0a8]" : "w-2 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
