"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function ScrambleBadge({ text }: { text: string }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const reset = window.setTimeout(() => setShown(text), 0);
      return () => window.clearTimeout(reset);
    }
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = [...text]
        .map((char, index) => {
          if (char === " ") return " ";
          if (frame > index + 8) return char;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setShown(next);
      if (frame > text.length + 8) window.clearInterval(timer);
    }, 42);
    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <p className="eyebrow">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </p>
  );
}
