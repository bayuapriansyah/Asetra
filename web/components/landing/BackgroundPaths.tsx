"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function FloatingPaths({ count = 36 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const paths = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }, (_, i) => {
      const r1 = seededRandom(i * 7 + 1);
      const r2 = seededRandom(i * 7 + 2);
      const r3 = seededRandom(i * 7 + 3);
      const r4 = seededRandom(i * 7 + 4);
      const r5 = seededRandom(i * 7 + 5);
      const r6 = seededRandom(i * 7 + 6);
      const r7 = seededRandom(i * 7 + 7);
      const startX = r1 * 200 - 50;
      const startY = r2 * 200 - 50;
      const endX = r3 * 200 - 50;
      const endY = r4 * 200 - 50;
      const controlX1 = r5 * 150 - 25;
      const controlY1 = r6 * 150 - 25;
      const controlX2 = r7 * 150 - 25;
      const controlY2 = seededRandom(i * 7 + 8) * 150 - 25;
      const d = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
      const strokeWidth = 0.5 + (i / count) * 0.5;
      const opacity = 0.03 + (i / count) * 0.07;
      const duration = 20 + seededRandom(i * 7 + 9) * 10;

      return { d, strokeWidth, opacity, duration, delay: i * 0.1 };
    });
  }, [count, mounted]);

  if (!mounted) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="-50 -50 200 200"
      preserveAspectRatio="none"
    >
      {paths.map((path, i) => (
        <motion.path
          key={i}
          d={path.d}
          fill="transparent"
          stroke="#4a9eff"
          strokeWidth={path.strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, path.opacity, 0],
          }}
          transition={{
            duration: path.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: path.delay,
          }}
        />
      ))}
    </svg>
  );
}

export function BackgroundPaths({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <FloatingPaths count={36} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
