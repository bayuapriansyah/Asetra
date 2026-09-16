"use client";

import { useMemo } from "react";

const ASCII_CHARS = "01{}[]<>/\\|;:=+*#@!?~`.";

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function DataFlow({ side }: { side: "left" | "right" }) {
  const streams = useMemo(() => {
    const result: { x: number; chars: { ch: string; y: number; opacity: number }[]; dur: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const seed = i * 137 + (side === "right" ? 999 : 0);
      const chars: { ch: string; y: number; opacity: number }[] = [];
      const len = 5 + Math.floor(seededRandom(seed) * 5);
      for (let j = 0; j < len; j++) {
        const ci = Math.floor(seededRandom(seed + j * 31) * ASCII_CHARS.length);
        chars.push({
          ch: ASCII_CHARS[ci],
          y: j * 16,
          opacity: Math.max(0.1, 0.6 - j * 0.08),
        });
      }
      result.push({
        x: 10 + seededRandom(seed + 7) * 75,
        chars,
        dur: 5 + seededRandom(seed + 11) * 6,
      });
    }
    return result;
  }, [side]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        [side]: 0,
        width: "18%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`df-${side}`} x1={side === "left" ? "1" : "0"} y1="0" x2={side === "left" ? "0" : "1"} y2="0">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`dfv-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="12%" stopColor="white" />
            <stop offset="80%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`dfm-${side}`}>
            <rect width="100" height="100" fill={`url(#df-${side})`} />
            <rect width="100" height="100" fill={`url(#dfv-${side})`} style={{ mixBlendMode: "multiply" } as React.CSSProperties} />
          </mask>
        </defs>

        <g mask={`url(#dfm-${side})`}>
          {streams.map((s, si) => (
            <g key={si}>
              {s.chars.map((c, ci) => (
                <text
                  key={ci}
                  x={s.x}
                  y={c.y}
                  fill="#4a9eff"
                  fillOpacity={c.opacity}
                  fontSize="3"
                  fontFamily="'Courier New',monospace"
                  textAnchor="middle"
                >
                  {c.ch}
                  <animate
                    attributeName="y"
                    from="-20"
                    to="120"
                    dur={`${s.dur}s`}
                    begin={`${si * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="fill-opacity"
                    values={`${c.opacity};${c.opacity * 0.5};${c.opacity}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </text>
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
