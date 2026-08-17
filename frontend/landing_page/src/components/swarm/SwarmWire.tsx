import React from 'react'
import { SwarmWireConnection, SwarmCanvasNode } from './types'

interface SwarmWireProps {
  wire: SwarmWireConnection
  fromNode?: SwarmCanvasNode
  toNode?: SwarmCanvasNode
  isSelected: boolean
  isExecuting?: boolean
  isLightTheme?: boolean
  onSelect: (wireId: string) => void
  onDelete: (wireId: string) => void
}

export const SwarmWire: React.FC<SwarmWireProps> = ({
  wire,
  fromNode,
  toNode,
  isSelected,
  isExecuting,
  isLightTheme,
  onSelect,
  onDelete,
}) => {
  if (!fromNode || !toNode) return null

  // Calculate Port Coordinates
  const getPortCoord = (node: SwarmCanvasNode, portId: string, isFrom: boolean) => {
    const width = node.width || 200
    const height = node.height || 90

    // Check subports first
    if (node.subPorts) {
      const subIdx = node.subPorts.findIndex((p) => p.id === portId)
      if (subIdx !== -1) {
        const totalSubs = node.subPorts.length
        const spacing = width / (totalSubs + 1)
        return {
          x: node.x + spacing * (subIdx + 1),
          y: node.y + height,
          position: 'bottom',
        }
      }
    }

    // Check regular outputs
    if (isFrom && node.outputs) {
      const outIdx = node.outputs.findIndex((p) => p.id === portId)
      if (outIdx !== -1) {
        const total = node.outputs.length
        return {
          x: node.x + width,
          y: node.y + (height / (total + 1)) * (outIdx + 1),
          position: 'right',
        }
      }
    }

    // Check regular inputs
    if (!isFrom && node.inputs) {
      const inIdx = node.inputs.findIndex((p) => p.id === portId)
      if (inIdx !== -1) {
        const port = node.inputs[inIdx]
        if (port.position === 'top') {
          return {
            x: node.x + width / 2,
            y: node.y,
            position: 'top',
          }
        }
        return {
          x: node.x,
          y: node.y + (height / (node.inputs.length + 1)) * (inIdx + 1),
          position: 'left',
        }
      }
    }

    // Default fallback coordinates
    return isFrom
      ? { x: node.x + width, y: node.y + height / 2, position: 'right' }
      : { x: node.x, y: node.y + height / 2, position: 'left' }
  }

  const p1 = getPortCoord(fromNode, wire.fromPortId, true)
  const p2 = getPortCoord(toNode, wire.toPortId, false)

  // Compute Bezier Curve Path
  const dx = Math.abs(p2.x - p1.x)
  const dy = Math.abs(p2.y - p1.y)
  const curvature = Math.max(40, Math.min(130, Math.sqrt(dx * dx + dy * dy) * 0.42))

  let c1x = p1.x
  let c1y = p1.y
  let c2x = p2.x
  let c2y = p2.y

  if (p1.position === 'right') c1x += curvature
  else if (p1.position === 'left') c1x -= curvature
  else if (p1.position === 'bottom') c1y += curvature
  else if (p1.position === 'top') c1y -= curvature

  if (p2.position === 'left') c2x -= curvature
  else if (p2.position === 'right') c2x += curvature
  else if (p2.position === 'top') c2y -= curvature
  else if (p2.position === 'bottom') c2y += curvature

  const pathD = `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`

  // Midpoint for label badge
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  const strokeColor = wire.color || (isLightTheme ? '#7C3AED' : '#10B981')
  const isGlowing = isExecuting || wire.isAnimated

  return (
    <g className="group cursor-pointer font-sans" onClick={() => onSelect(wire.id)}>
      {/* Thick invisible hover stroke for easy clicking */}
      <path d={pathD} fill="none" stroke="transparent" strokeWidth={24} className="cursor-pointer" />

      {/* Base Wire Glow */}
      {(isSelected || isGlowing) && (
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isSelected ? 6 : 4}
          strokeOpacity={isSelected ? 0.45 : 0.25}
          className="transition-all duration-300"
        />
      )}

      {/* Main Wire Path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#38BDF8' : strokeColor}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeDasharray={wire.label?.includes('Memory') && fromNode.isDeactivated ? '4 4' : undefined}
        strokeOpacity={fromNode.isDeactivated ? 0.35 : 0.85}
        className="transition-colors duration-200"
      />

      {/* Animated Flowing Signal Pulses when active */}
      {isGlowing && !fromNode.isDeactivated && (
        <path
          d={pathD}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeDasharray="6 14"
          className="animate-flowing-wire"
          strokeOpacity={0.9}
        />
      )}

      {/* Start and End Anchor Dot Rings */}
      <circle cx={p1.x} cy={p1.y} r={3.5} fill={strokeColor} className="transition-transform group-hover:scale-125" />
      <circle cx={p2.x} cy={p2.y} r={3.5} fill={strokeColor} className="transition-transform group-hover:scale-125" />

      {/* Label Badge or Item Count Tag */}
      {(wire.itemCount || wire.label) && (
        <g
          transform={`translate(${midX}, ${midY})`}
          className="pointer-events-auto select-none font-sans"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(wire.id)
          }}
        >
          <rect
            x={-42}
            y={-11}
            width={84}
            height={22}
            rx={11}
            fill={isLightTheme ? '#FFFFFF' : '#181820'}
            stroke={isSelected ? '#38BDF8' : isLightTheme ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={1}
            className="shadow-md transition-colors group-hover:border-zinc-500"
          />
          <text
            x={0}
            y={3.5}
            textAnchor="middle"
            fill={wire.itemCount ? (isLightTheme ? '#7C3AED' : '#10B981') : isLightTheme ? '#4B5563' : '#9CA3AF'}
            fontSize={10}
            fontWeight={600}
            fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {wire.itemCount || wire.label}
          </text>
        </g>
      )}

      {/* Disconnect / Delete button when selected */}
      {isSelected && (
        <g
          transform={`translate(${midX + 50}, ${midY})`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(wire.id)
          }}
          className="cursor-pointer"
        >
          <circle cx={0} cy={0} r={8.5} fill="#EF4444" className="hover:scale-110 transition-transform shadow-md" />
          <text
            x={0}
            y={3.5}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={11}
            fontWeight={800}
            fontFamily="'Inter', system-ui, sans-serif"
          >
            ×
          </text>
        </g>
      )}
    </g>
  )
}
