import React, { useState, useEffect, useRef } from "react"
import { useTheme } from "../ThemeProvider"

export interface MeshGradientSVGProps {
  className?: string
  size?: number
}

export function MeshGradientSVG({ className = "", size = 200 }: MeshGradientSVGProps) {
  const { theme } = useTheme()
  const isLight = theme === "light"

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Animated Mesh Gradient Canvas (Theme Adaptive)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let t = 0

    // Palette per theme
    const darkColors = [
      { r: 255, g: 179, b: 217 }, // Pastel pink
      { r: 135, g: 206, b: 235 }, // Sky blue
      { r: 74, g: 144, b: 226 },  // Medium blue
      { r: 124, g: 58, b: 237 },  // Violet
      { r: 26, g: 26, b: 46 },    // Deep blue
    ]

    const lightColors = [
      { r: 244, g: 114, b: 182 }, // Vivid rose
      { r: 56, g: 189, b: 248 },  // Cyan sky
      { r: 99, g: 102, b: 241 },  // Indigo blue
      { r: 139, g: 92, b: 246 },  // Rich violet
      { r: 251, g: 113, b: 133 }, // Coral
    ]

    const colors = isLight ? lightColors : darkColors
    const bgBase = isLight ? "#EDE9FE" : "#1A1A2E"

    const render = () => {
      t += 0.015
      const w = canvas.width
      const h = canvas.height

      // Clear base
      ctx.fillStyle = bgBase
      ctx.fillRect(0, 0, w, h)

      // Blob 1 (Top Left / Pink / Coral)
      const x1 = w * 0.35 + Math.sin(t * 0.8) * (w * 0.25)
      const y1 = h * 0.3 + Math.cos(t * 0.7) * (h * 0.2)
      const grad1 = ctx.createRadialGradient(x1, y1, 10, x1, y1, w * 0.65)
      grad1.addColorStop(0, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, 0.95)`)
      grad1.addColorStop(1, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, 0)`)
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)

      // Blob 2 (Top Right / Sky Blue)
      const x2 = w * 0.7 + Math.cos(t * 0.9) * (w * 0.2)
      const y2 = h * 0.4 + Math.sin(t * 1.1) * (h * 0.25)
      const grad2 = ctx.createRadialGradient(x2, y2, 10, x2, y2, w * 0.6)
      grad2.addColorStop(0, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, 0.9)`)
      grad2.addColorStop(1, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, 0)`)
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, w, h)

      // Blob 3 (Bottom Left / Violet)
      const x3 = w * 0.4 + Math.sin(t * 1.2) * (w * 0.25)
      const y3 = h * 0.75 + Math.cos(t * 0.9) * (h * 0.2)
      const grad3 = ctx.createRadialGradient(x3, y3, 10, x3, y3, w * 0.7)
      grad3.addColorStop(0, `rgba(${colors[3].r}, ${colors[3].g}, ${colors[3].b}, 0.9)`)
      grad3.addColorStop(1, `rgba(${colors[3].r}, ${colors[3].g}, ${colors[3].b}, 0)`)
      ctx.fillStyle = grad3
      ctx.fillRect(0, 0, w, h)

      // Blob 4 (Center / Indigo / Blue)
      const x4 = w * 0.5 + Math.cos(t * 0.6) * (w * 0.2)
      const y4 = h * 0.55 + Math.sin(t * 0.8) * (h * 0.25)
      const grad4 = ctx.createRadialGradient(x4, y4, 10, x4, y4, w * 0.55)
      grad4.addColorStop(0, `rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b}, 0.85)`)
      grad4.addColorStop(1, `rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b}, 0)`)
      ctx.fillStyle = grad4
      ctx.fillRect(0, 0, w, h)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isLight])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Calculate eye offset towards cursor
  useEffect(() => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (mousePosition.x - centerX) * 0.06
    const deltaY = (mousePosition.y - centerY) * 0.06

    const maxOffset = 10
    setEyeOffset({
      x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
    })
  }, [mousePosition])

  const ghostPath =
    "M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z"

  return (
    <div
      className={`mesh-ghost-container ${className}`}
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "ghostFloat 3s ease-in-out infinite",
        transformOrigin: "top center",
      }}
    >
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={(size * 289) / 231}
        viewBox="0 0 231 289"
        style={{
          overflow: "visible",
          filter: isLight
            ? "drop-shadow(0 14px 28px rgba(124, 58, 237, 0.22))"
            : "drop-shadow(0 14px 32px rgba(124, 58, 237, 0.38))",
        }}
      >
        <defs>
          <clipPath id="shapeClipMesh">
            <path d={ghostPath} />
          </clipPath>
        </defs>

        {/* Clipped Animated Mesh Shader */}
        <foreignObject width="231" height="289" clipPath="url(#shapeClipMesh)">
          <div style={{ width: 231, height: 289, overflow: "hidden" }}>
            <canvas ref={canvasRef} width={231} height={289} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
        </foreignObject>

        {/* Silhouette Outline for crisp boundary in both light and dark mode */}
        <path
          d={ghostPath}
          fill="none"
          stroke={isLight ? "rgba(124, 58, 237, 0.3)" : "rgba(255, 255, 255, 0.14)"}
          strokeWidth="2"
        />

        {/* Left Eye */}
        <g
          className="ghost-eye"
          style={{
            transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
            transformOrigin: "78px 120px",
          }}
        >
          <ellipse cx="78" cy="120" rx="16" ry="24" fill={isLight ? "#090D16" : "#0F172A"} />
          <circle cx="74" cy="112" r="6" fill="#FFFFFF" opacity="0.95" />
          <circle cx="82" cy="128" r="3" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* Right Eye */}
        <g
          className="ghost-eye"
          style={{
            transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
            transformOrigin: "153px 120px",
          }}
        >
          <ellipse cx="153" cy="120" rx="16" ry="24" fill={isLight ? "#090D16" : "#0F172A"} />
          <circle cx="149" cy="112" r="6" fill="#FFFFFF" opacity="0.95" />
          <circle cx="157" cy="128" r="3" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* Cute blush cheeks */}
        <ellipse cx="56" cy="148" rx="14" ry="8" fill={isLight ? "#FB7185" : "#FF77C6"} opacity={isLight ? 0.5 : 0.4} filter="blur(2px)" />
        <ellipse cx="175" cy="148" rx="14" ry="8" fill={isLight ? "#FB7185" : "#FF77C6"} opacity={isLight ? 0.5 : 0.4} filter="blur(2px)" />
      </svg>

      <style>{`
        @keyframes ghostFloat {
          0%, 100% {
            transform: translateY(0px) scaleY(1);
          }
          50% {
            transform: translateY(-10px) scaleY(1.04);
          }
        }
        .ghost-eye {
          animation: ghostBlink 3.8s infinite ease-in-out;
        }
        @keyframes ghostBlink {
          0%, 88%, 100% {
            transform: scaleY(1);
          }
          93% {
            transform: scaleY(0.08);
          }
        }
      `}</style>
    </div>
  )
}
