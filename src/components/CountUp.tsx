"use client";

import { useEffect, useState } from "react";

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const reset = window.setTimeout(() => setShown(value), 0);
      return () => window.clearTimeout(reset);
    }
    let frame = 0;
    const steps = 14;
    const timer = window.setInterval(() => {
      frame += 1;
      setShown(Math.round((value * Math.min(frame, steps)) / steps));
      if (frame >= steps) window.clearInterval(timer);
    }, 32);
    return () => window.clearInterval(timer);
  }, [value]);

  return <>{shown}</>;
}
