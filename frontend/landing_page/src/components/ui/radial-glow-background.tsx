import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface RadialGlowBackgroundProps {
  glowColor?: string;
  glowOpacity?: number;
  glowRadius?: number;
  glowPosition?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const RadialGlowBackground: React.FC<RadialGlowBackgroundProps> = ({
  glowColor = "rgba(124, 58, 237, 0.35)",
  glowOpacity = 0.45,
  glowRadius = 550,
  glowPosition = "50% 220px",
  className,
  children,
  style,
}) => {
  return (
    <div className={cn("min-h-full w-full relative overflow-hidden", className)} style={style}>
      {/* Dynamic Radial Glow Background */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out z-0"
        style={{
          backgroundImage: `radial-gradient(circle ${glowRadius}px at ${glowPosition}, ${glowColor}, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen w-full bg-[#020617] relative">
      {/* Dark Radial Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle 500px at 50% 200px, #3e3e3e, transparent)`,
        }}
      />
      {/* Your Content/Components */}
    </div>
  );
};

export default RadialGlowBackground;
