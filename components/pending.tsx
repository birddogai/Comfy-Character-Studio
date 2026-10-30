"use client";

import { useEffect, useState } from "react";

// A shimmering card the size of the coming result, with a running timer.
// In a gallery it fills its column; on its own, tall shapes are capped by height.
export function Pending({ ratio, label, fill = false }: { ratio: string; label: string; fill?: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="pending" style={{ aspectRatio: ratio.replace(":", " / "), ...size(ratio, fill) }} role="status">
      <span>{label}</span>
      <small>{seconds}s</small>
    </div>
  );
}

function size(ratio: string, fill: boolean) {
  const [width, height] = ratio.split(":").map(Number);
  if (fill) return { width: "100%" };
  return width >= height ? { width: "min(100%, 720px)" } : { height: "min(560px, 70vh)" };
}
