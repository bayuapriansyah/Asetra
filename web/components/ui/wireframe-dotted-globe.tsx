"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

import precomputedDots from "@/public/data/globe_dots.json"

interface RotatingEarthProps {
  size?: number
  mobileSize?: number
  width?: number
  height?: number
  className?: string
}

interface DotData {
  lng: number
  lat: number
}

// Precomputed dots loaded synchronously at bundle time (0ms network delay, 0ms CPU computation)
const PRECOMPUTED_DOTS: DotData[] = (precomputedDots as [number, number][]).map(
  ([lng, lat]) => ({ lng, lat })
)

// Global module-level cache so dots & geometry persist across re-renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedLandFeatures: any = null
let cachedDots: DotData[] = PRECOMPUTED_DOTS

export default function RotatingEarth({
  size = 680,
  mobileSize,
  width,
  height,
  className = "",
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const baseSize = size ?? Math.min(width ?? 680, height ?? 680)
  const [actualSize, setActualSize] = useState(baseSize)

  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < 1024
      if (isMobile) {
        // In mobile mode, respect mobileSize or baseSize directly so it can act as a watermark
        setActualSize(mobileSize ?? baseSize)
      } else {
        // In desktop mode, constrain by viewport height if needed so layout stays balanced
        const maxHeight = window.innerHeight - 90
        const computed = Math.min(baseSize, maxHeight > 400 ? maxHeight : 400)
        setActualSize(computed)
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [baseSize, mobileSize])

  useEffect(() => {
    if (!canvasRef.current || actualSize <= 0) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Enforce strictly 1:1 square canvas resolution and layout
    const containerSize = actualSize
    const radius = (containerSize / 2) * 0.93

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(containerSize * dpr)
    canvas.height = Math.round(containerSize * dpr)
    canvas.style.width = `${containerSize}px`
    canvas.style.height = `${containerSize}px`
    canvas.style.aspectRatio = "1 / 1"
    context.scale(dpr, dpr)

    const cx = containerSize / 2
    const cy = containerSize / 2

    // Orthographic projection centered at (cx, cy) with 1:1 scale
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([cx, cy])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    let allDots: DotData[] = cachedDots || PRECOMPUTED_DOTS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let landFeatures: any = cachedLandFeatures

    const render = () => {
      context.clearRect(0, 0, containerSize, containerSize)

      // 1. Deep space volumetric ambient sphere (Strictly circular)
      const globeGrad = context.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.25,
        radius * 0.1,
        cx,
        cy,
        radius
      )
      globeGrad.addColorStop(0, "rgba(8, 18, 38, 0.72)")
      globeGrad.addColorStop(0.7, "rgba(4, 10, 22, 0.88)")
      globeGrad.addColorStop(1, "rgba(2, 6, 15, 0.98)")

      context.beginPath()
      context.arc(cx, cy, radius, 0, 2 * Math.PI)
      context.fillStyle = globeGrad
      context.fill()

      // 2. Outer atmospheric rim glow
      context.strokeStyle = "rgba(74, 158, 255, 0.35)"
      context.lineWidth = 1.2
      context.stroke()

      // 3. Subtle graticule grid lines
      const graticule = d3.geoGraticule().step([18, 18])
      context.beginPath()
      path(graticule())
      context.strokeStyle = "rgba(74, 158, 255, 0.09)"
      context.lineWidth = 0.55
      context.stroke()

      if (landFeatures) {
        // 4. Subtle land contour
        context.beginPath()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        landFeatures.features.forEach((feature: any) => {
          path(feature)
        })
        context.strokeStyle = "rgba(74, 158, 255, 0.22)"
        context.lineWidth = 0.6
        context.stroke()

        // 5. 3D depth-attenuated dots
        const rot = projection.rotate()
        const centerLng = -rot[0]
        const centerLat = -rot[1]

        for (let i = 0; i < allDots.length; i++) {
          const dot = allDots[i]
          const dist = d3.geoDistance([dot.lng, dot.lat], [centerLng, centerLat])
          if (dist >= Math.PI / 2) continue

          const projected = projection([dot.lng, dot.lat])
          if (
            !projected ||
            projected[0] < 0 ||
            projected[0] > containerSize ||
            projected[1] < 0 ||
            projected[1] > containerSize
          ) {
            continue
          }

          // Depth shading factor: front-facing dots are brighter & sharper
          const cosTheta = Math.cos(dist)
          const alpha = Math.max(0.18, Math.pow(cosTheta, 0.7) * 0.95)
          const dotRadius = 0.75 + 0.65 * cosTheta

          context.beginPath()
          context.arc(projected[0], projected[1], dotRadius, 0, 2 * Math.PI)
          context.fillStyle = `rgba(110, 190, 255, ${alpha})`
          context.fill()
        }
      }
    }

    // Initial render
    render()

    const loadWorldData = async () => {
      if (cachedLandFeatures) {
        landFeatures = cachedLandFeatures
        render()
        return
      }

      try {
        const response = await fetch("/data/ne_110m_land.json").catch(() => null)
        if (!response || !response.ok) return
        const data = await response.json()
        landFeatures = data
        cachedLandFeatures = data
        render()
      } catch {
        // dots are already rendered and rotating smoothly
      }
    }

    const rotation = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.25

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation as [number, number])
        render()
      }
    }

    const rotationTimer = d3.timer(rotate)

    // Interactive Drag to Rotate (No zoom)
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.4
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = startRotation[1] - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))
        projection.rotate(rotation as [number, number])
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        setTimeout(() => {
          autoRotate = true
        }, 10)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    canvas.addEventListener("mousedown", handleMouseDown)

    loadWorldData()

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
    }
  }, [actualSize])

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center aspect-square ${className}`}
      style={{
        width: actualSize,
        height: actualSize,
        aspectRatio: "1 / 1",
      }}
    >
      <canvas
        ref={canvasRef}
        className="aspect-square cursor-grab active:cursor-grabbing select-none block"
        style={{
          width: actualSize,
          height: actualSize,
          aspectRatio: "1 / 1",
        }}
      />
    </div>
  )
}
