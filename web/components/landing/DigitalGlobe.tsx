"use client";

import React, { useEffect, useRef } from "react";

// Procedural continent test (lat/lon in degrees)
function isLand(lat: number, lon: number): boolean {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  // North America
  if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) {
    if (lat < 30 && lon < -105) return false;
    if (lat > 55 && lon > -60) return false;
    return true;
  }
  // Central America
  if (lat >= 7 && lat <= 18 && lon >= -100 && lon <= -75) return true;

  // South America
  if (lat >= -56 && lat <= 12 && lon >= -82 && lon <= -34) {
    if (lon < -80 && lat < -5) return false;
    if (lon > -40 && lat < -30) return false;
    return true;
  }

  // Europe
  if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 45) return true;

  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
    if (lon < -10 && lat < 5) return false;
    if (lon > 45 && lat < -10) return false;
    return true;
  }

  // Asia / Russia
  if (lat >= 10 && lat <= 75 && lon >= 45 && lon <= 180) {
    if (lat < 25 && lon > 45 && lon < 65) return false;
    return true;
  }

  // India
  if (lat >= 8 && lat <= 30 && lon >= 68 && lon <= 88) return true;

  // Southeast Asia / Oceania
  if (lat >= -10 && lat <= 20 && lon >= 95 && lon <= 135) return true;

  // Japan
  if (lat >= 30 && lat <= 45 && lon >= 130 && lon <= 145) return true;

  // Australia
  if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 178) {
    if (lon > 155 && lat > -30) return false;
    return true;
  }

  // Greenland / Arctic
  if (lat >= 60 && lat <= 83 && lon >= -55 && lon <= -18) return true;

  return false;
}

// Major institutional financial hubs
const HUBS = [
  { name: "New York", lat: 40.71, lon: -74.0 },
  { name: "London", lat: 51.5, lon: -0.12 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Tokyo", lat: 35.67, lon: 139.65 },
  { name: "Zurich", lat: 47.37, lon: 8.54 },
  { name: "Dubai", lat: 25.2, lon: 55.27 },
];

export default function DigitalGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    interface SpherePoint {
      x0: number;
      y0: number;
      z0: number;
      isLand: boolean;
      size: number;
      baseAlpha: number;
    }

    const points: SpherePoint[] = [];

    // 1. Latitude parallels (sparse, fine dots)
    const latRings = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
    for (const latDeg of latRings) {
      const latRad = (latDeg * Math.PI) / 180;
      const ringCount = Math.max(20, Math.floor(48 * Math.cos(latRad)));
      for (let i = 0; i < ringCount; i++) {
        const lonRad = (i / ringCount) * Math.PI * 2 - Math.PI;
        points.push({
          x0: Math.cos(latRad) * Math.sin(lonRad),
          y0: -Math.sin(latRad),
          z0: Math.cos(latRad) * Math.cos(lonRad),
          isLand: false,
          size: 0.65,
          baseAlpha: 0.12,
        });
      }
    }

    // 2. Longitude meridians (very subtle lines)
    const lonCount = 12;
    for (let m = 0; m < lonCount; m++) {
      const lonRad = (m / lonCount) * Math.PI * 2 - Math.PI;
      const ptsAlongMeridian = 32;
      for (let j = 0; j <= ptsAlongMeridian; j++) {
        const latRad = ((j / ptsAlongMeridian) * 150 - 75) * (Math.PI / 180);
        points.push({
          x0: Math.cos(latRad) * Math.sin(lonRad),
          y0: -Math.sin(latRad),
          z0: Math.cos(latRad) * Math.cos(lonRad),
          isLand: false,
          size: 0.6,
          baseAlpha: 0.09,
        });
      }
    }

    // 3. Realistic Continent Landmass dots (curated, small, elegant)
    const latStep = 3.2;
    const lonStep = 3.2;
    for (let lat = -65; lat <= 72; lat += latStep) {
      const latRad = (lat * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const step = lonStep / Math.max(0.25, cosLat);
      for (let lon = -180; lon < 180; lon += step) {
        if (isLand(lat, lon)) {
          const lonRad = (lon * Math.PI) / 180;
          points.push({
            x0: cosLat * Math.sin(lonRad),
            y0: -Math.sin(latRad),
            z0: cosLat * Math.cos(lonRad),
            isLand: true,
            size: 0.85,
            baseAlpha: 0.5,
          });
        }
      }
    }

    // 4. Subtle ambient space particles floating around the horizon
    const ambientParticles: { x: number; y: number; size: number; alpha: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 10; i++) {
      ambientParticles.push({
        x: Math.random(),
        y: 0.45 + Math.random() * 0.55,
        size: 0.4 + Math.random() * 0.6,
        alpha: 0.04 + Math.random() * 0.1,
        speed: 0.0003 + Math.random() * 0.0006,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Subtle mouse tracking for gentle parallax
    let mouseX = 0;
    let targetMouseX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      targetMouseX = nx * 0.2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation state
    let rotY = 0.8;
    const tiltX = 0.32; // ~18 deg downward view

    const render = (time: number) => {
      rotY += 0.0016; // calm, slow rotation
      mouseX += (targetMouseX - mouseX) * 0.03;
      const currentRotY = rotY + mouseX;

      ctx.clearRect(0, 0, width, height);

      // Sphere geometry:
      // Position center BELOW the hero so only 35% - 45% of the upper sphere
      // rises up from the bottom like a clean digital horizon
      const radius = Math.min(width * 0.52, height * 0.95, 520);
      const cx = width * 0.5;
      // Globe center sits below or right at the bottom edge:
      const cy = height * 0.92 + radius * 0.15;
      const horizonTopY = cy - radius; // uppermost reach of the sphere

      // 1. Soft, diffused atmospheric glow behind the horizon
      // Very subtle radial gradient, no harsh lines
      const auraGrad = ctx.createRadialGradient(cx, cy - radius * 0.2, radius * 0.4, cx, cy, radius * 1.15);
      auraGrad.addColorStop(0, "rgba(50, 120, 240, 0.03)");
      auraGrad.addColorStop(0.4, "rgba(20, 80, 200, 0.015)");
      auraGrad.addColorStop(0.8, "rgba(5, 40, 120, 0.005)");
      auraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Rotation matrix precalc
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);

      // 2. Render globe dots
      // Only render front-facing points (z > -0.1) for a clean, non-cluttered look
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];

        // Rotate Y
        const x1 = pt.x0 * cosY + pt.z0 * sinY;
        const z1 = -pt.x0 * sinY + pt.z0 * cosY;

        // Rotate X (tilt)
        const y2 = pt.y0 * cosX - z1 * sinX;
        const z2 = pt.y0 * sinX + z1 * cosX;

        // Skip back-facing points completely for a minimalist, clean aesthetic
        if (z2 <= -0.05) continue;

        // Screen projection
        const fov = 1400;
        const scale = fov / (fov + z2 * radius);
        const px = cx + x1 * radius * scale;
        const py = cy + y2 * radius * scale;

        // Vertical fade: dots near the bottom/center are clear;
        // as they approach the top (near headline), they smoothly fade to 0
        // horizonTopY is the crest of the sphere
        const fadeDist = radius * 0.75;
        const distFromCrest = py - horizonTopY;
        if (distFromCrest <= 0) continue;

        // Smoothstep fade curve toward headline
        const verticalFade = Math.min(1, Math.max(0, distFromCrest / fadeDist));
        const smoothFade = verticalFade * verticalFade * (3 - 2 * verticalFade);

        // Depth modifier
        const depthNorm = (z2 + 1) * 0.5;
        const alpha = pt.baseAlpha * smoothFade * (0.35 + depthNorm * 0.65);

        if (alpha < 0.015) continue;

        const dotSize = pt.size * (0.8 + depthNorm * 0.35);

        // Soft, elegant blue-white dot colors
        if (pt.isLand) {
          ctx.fillStyle = depthNorm > 0.6
            ? `rgba(215, 235, 255, ${alpha})`
            : `rgba(90, 160, 255, ${alpha * 0.9})`;
        } else {
          ctx.fillStyle = `rgba(74, 140, 240, ${alpha * 0.5})`;
        }

        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Hubs: minimal, elegant beacon pips
      for (const hub of HUBS) {
        const latRad = (hub.lat * Math.PI) / 180;
        const lonRad = (hub.lon * Math.PI) / 180;
        const x0 = Math.cos(latRad) * Math.sin(lonRad);
        const y0 = -Math.sin(latRad);
        const z0 = Math.cos(latRad) * Math.cos(lonRad);

        const x1 = x0 * cosY + z0 * sinY;
        const z1 = -x0 * sinY + z0 * cosY;
        const y2 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;

        if (z2 > 0.15) {
          const fov = 1400;
          const scale = fov / (fov + z2 * radius);
          const px = cx + x1 * radius * scale;
          const py = cy + y2 * radius * scale;

          const distFromCrest = py - horizonTopY;
          if (distFromCrest > 40) {
            const vFade = Math.min(1, distFromCrest / (radius * 0.6));
            const pulse = (Math.sin(time * 0.0025 + hub.lat) + 1) * 0.5;

            // Small soft beacon dot
            ctx.fillStyle = `rgba(180, 220, 255, ${0.7 * vFade})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Very subtle single pulse ring
            ctx.strokeStyle = `rgba(100, 180, 255, ${(1 - pulse) * 0.35 * vFade})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(px, py, 2.5 + pulse * 4.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // 4. Subtle ambient particles near horizon
      for (const p of ambientParticles) {
        p.phase += p.speed * 12;
        const curAlpha = p.alpha * (0.6 + Math.sin(p.phase) * 0.4);
        const px = p.x * width;
        const py = p.y * height;

        ctx.fillStyle = `rgba(120, 180, 255, ${curAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. ULTRA-SUBTLE BACKGROUND CORNER TEXTURE                   */}
      {/* Faint cryptographic/matrix feel with whisper-thin opacity   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 w-80 h-64 pointer-events-none opacity-[0.045] [mask-image:radial-gradient(ellipse_75%_75%_at_0%_0%,black_30%,transparent_80%)]"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "10px",
          lineHeight: "1.3",
          letterSpacing: "0.2em",
          color: "#9ecaff",
        }}
      >
        <div className="select-none p-4 whitespace-pre leading-none">
          {`0x9F42...BOT\nSYS::SETTLE\nSTATE::ACTIVE\n[VERIFIED]\n8888 4421\n1001 0110\nFIN_RWA::OK`}
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-80 h-64 pointer-events-none opacity-[0.045] [mask-image:radial-gradient(ellipse_75%_75%_at_100%_0%,black_30%,transparent_80%)] flex justify-end"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "10px",
          lineHeight: "1.3",
          letterSpacing: "0.2em",
          color: "#9ecaff",
        }}
      >
        <div className="select-none p-4 text-right whitespace-pre leading-none">
          {`CHAIN_ID:968\nPROTO::ASETRA\nAUDIT::PASSED\n[CONSENSUS]\n4421 8888\n0110 1001\nNODE_SYNC::1`}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. 3D DIGITAL HORIZON GLOBE CANVAS                          */}
      {/* Rising from the bottom as an elegant semi-circle horizon    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Smooth bottom blend so it emerges seamlessly from base   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #111111 20%, transparent 100%)",
        }}
      />
    </div>
  );
}
