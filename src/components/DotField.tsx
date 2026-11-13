"use client";

import { useEffect, useRef } from "react";

export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width / 2));
      const height = Math.max(1, Math.floor(rect.height / 2));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const reach = Math.max(width, height) * 0.72;
      for (let y = 1; y < height; y += 3) {
        for (let x = 1; x < width; x += 3) {
          const fade = 1 - Math.hypot(x - width / 2, y) / reach;
          if (fade <= 0) continue;
          ctx.fillStyle = `rgba(237, 237, 237, ${fade * 0.5})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return <canvas ref={ref} className="dot-field" aria-hidden="true" />;
}
