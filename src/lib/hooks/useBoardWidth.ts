"use client";

import { useEffect, useState } from "react";

/**
 * Responsive square board size. The first measurement happens inside a
 * requestAnimationFrame callback so nothing is set synchronously during
 * the effect (avoids cascading renders) and SSR just uses `max`.
 */
export function useBoardWidth({
  max = 480,
  min = 280,
  padding = 32,
}: {
  max?: number;
  min?: number;
  padding?: number;
} = {}) {
  const [width, setWidth] = useState(max);

  useEffect(() => {
    function update() {
      setWidth(Math.max(min, Math.min(max, window.innerWidth - padding)));
    }
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [max, min, padding]);

  return width;
}
