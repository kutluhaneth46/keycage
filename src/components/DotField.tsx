"use client";

import { useEffect, useRef } from "react";

export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const reach = Math.max(width, height) * 0.72;
      for (let y = 2; y < height; y += 5) {
        for (let x = 2; x < width; x += 5) {
          const dist = Math.hypot(x - width / 2, y);
          const fade = 1 - dist / reach;
          if (fade <= 0) continue;
          const alpha = reduce ? fade * 0.45 : fade * (0.2 + Math.random() * 0.8);
          ctx.fillStyle = `rgba(237, 237, 237, ${alpha})`;
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
    };

    const tick = (now: number) => {
      if (now - last >= 1000 / 24) {
        last = now;
        draw();
      }
      raf = window.requestAnimationFrame(tick);
    };

    draw();
    if (!reduce) raf = window.requestAnimationFrame(tick);
    window.addEventListener("resize", draw);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, []);

  return <canvas ref={ref} className="dot-field" aria-hidden="true" />;
}
