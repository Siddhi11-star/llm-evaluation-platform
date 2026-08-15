import React from 'react'
import { Link } from 'react-router'
import { useTheme } from './ThemeProvider'

interface LogoProps {
  size?: number
  fontSize?: number
  to?: string
  showText?: boolean
  className?: string
  style?: React.CSSProperties
}

export function LogoIcon({ size = 36 }: { size?: number }) {
  const { theme } = useTheme()
  const isDark = theme !== 'light'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Dark Mode Gradient — Signature JudgeAI Neon Violet to Hot Magenta to Coral */}
        <linearGradient
          id="catLogoGradientDark"
          x1="15%"
          y1="0%"
          x2="85%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="35%" stopColor="#EC4899" />
          <stop offset="70%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>

        {/* Light Mode Gradient — Deep Violet to Vivid Magenta to Cyan Accent */}
        <linearGradient
          id="catLogoGradientLight"
          x1="15%"
          y1="0%"
          x2="85%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>

      {/* Cat Head Body with Notched Left Ear & Rounded Form */}
      <path
        d="
          M 36 17
          C 34.5 17 33.5 18 33 19.5
          L 33 26
          C 33 27 34 27.5 35 28
          C 33.5 29 33 30.5 33 32
          C 33 33 34 33.5 35 34
          C 33 35 32 37 32 39
          C 25 45 23 54 25.5 63
          C 28 72 38 78 50 78
          C 62 78 72 72 74.5 63
          C 77 54 75 45 68 39
          C 68 36 67.5 32 68.5 28
          L 73 21
          C 74 19.5 73 18 71.5 18
          C 70.2 18 69.2 18.8 68.5 20
          L 59.5 32
          C 56 36 50 36 46.5 32
          L 38 18
          C 37.5 17.2 36.8 17 36 17
          Z
        "
        fill={isDark ? "url(#catLogoGradientDark)" : "url(#catLogoGradientLight)"}
      />

      {/* Left Eye Sclera */}
      <ellipse
        cx="38.5"
        cy="60"
        rx="8.5"
        ry="10.5"
        fill="#FFFFFF"
      />

      {/* Left Eye Pupil */}
      <ellipse
        cx="41"
        cy="60"
        rx="4.2"
        ry="7.2"
        fill={isDark ? "url(#catLogoGradientDark)" : "url(#catLogoGradientLight)"}
      />

      {/* Right Eye Sclera */}
      <ellipse
        cx="61.5"
        cy="60"
        rx="8.5"
        ry="10.5"
        fill="#FFFFFF"
      />

      {/* Right Eye Pupil */}
      <ellipse
        cx="59"
        cy="60"
        rx="4.2"
        ry="7.2"
        fill={isDark ? "url(#catLogoGradientDark)" : "url(#catLogoGradientLight)"}
      />

      {/* Left Whiskers */}
      <line
        x1="18"
        y1="63"
        x2="23"
        y2="62"
        stroke={isDark ? "#EC4899" : "#DB2777"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="70.5"
        x2="24"
        y2="66.5"
        stroke={isDark ? "#F43F5E" : "#E11D48"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Right Whiskers */}
      <line
        x1="82"
        y1="63"
        x2="77"
        y2="62"
        stroke={isDark ? "#EC4899" : "#DB2777"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <line
        x1="83"
        y1="70.5"
        x2="76"
        y2="66.5"
        stroke={isDark ? "#F43F5E" : "#E11D48"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({
  size = 36,
  fontSize = 17,
  to = '/',
  showText = true,
  className,
  style,
}: LogoProps) {
  return (
    <Link
      to={to}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        ...style,
      }}
    >
      <LogoIcon size={size} />
      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize,
            letterSpacing: '-0.02em',
            color: 'var(--color-foreground)',
          }}
        >
          JudgeAI
        </span>
      )}
    </Link>
  )
}
