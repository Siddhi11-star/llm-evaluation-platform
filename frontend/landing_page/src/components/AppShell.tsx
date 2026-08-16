import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router'
import { useSettings } from './ThemeProvider'
import { Logo } from './Logo'
import {
  IcHome,
  IcChat,
  IcEvaluations,
  IcJudge,
  IcSwarm,
  IcAdvisor,
  IcCompare,
  IcSettings,
  IcMenu,
  IcSun,
  IcMoon,
  IcSearch,
} from './icons'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: IcHome },
  { to: '/dashboard/chat', label: 'Chat', icon: IcChat },
  { to: '/dashboard/evaluations', label: 'Evaluations', icon: IcEvaluations },
  { to: '/dashboard/judges', label: 'Judge Agents', icon: IcJudge, aliases: ['/dashboard/judge-config'] },
  { to: '/dashboard/agent-swarm', label: 'Agent Swarm', icon: IcSwarm, aliases: ['/dashboard/agents'] },
  { to: '/dashboard/advisor', label: 'Advisor Agent', icon: IcAdvisor, aliases: ['/dashboard/advisor-agent'] },
  { to: '/dashboard/compare', label: 'Model Comparison', icon: IcCompare, aliases: ['/dashboard/model-comparison', '/dashboard/comparison'] },
  { to: '/dashboard/settings', label: 'Settings', icon: IcSettings },
]

export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-foreground)' }}>
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{children}</div>
    </div>
  )
}

export function PageContent({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="page-content-wrapper" style={{ padding: 'var(--page-padding, 24px)', ...style }}>
      {children}
    </div>
  )
}

export default function AppShell() {
  const { pathname } = useLocation()
  const { theme, toggleTheme, profile, sidebarCollapsed, setSidebarCollapsed } = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarWidth = sidebarCollapsed ? 72 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          background: 'var(--color-background)',
          transition: 'width 0.2s ease, background 0.15s ease, border-color 0.15s ease',
        }}
        className={mobileOpen ? 'max-md:!translate-x-0' : 'max-md:-translate-x-full'}
      >
        <div style={{ padding: sidebarCollapsed ? '18px 12px' : '18px 20px', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
          <Logo size={32} fontSize={sidebarCollapsed ? 0 : 17} />
        </div>

        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(({ to, label, icon: Icon, aliases }) => {
            const active =
              pathname === to ||
              (to !== '/dashboard' && pathname.startsWith(to)) ||
              (aliases && aliases.some(alias => pathname === alias || pathname.startsWith(alias)))
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className="nav-item-smooth"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: 10,
                  padding: sidebarCollapsed ? '10px' : '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: active ? 'var(--color-nav-active-fg)' : 'var(--color-muted)',
                  background: active ? 'var(--color-nav-active-bg)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--color-hover)'
                    e.currentTarget.style.color = 'var(--color-foreground)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-muted)'
                  }
                }}
              >
                <Icon size={18} />
                {!sidebarCollapsed && label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: sidebarCollapsed ? '12px 8px' : '16px 20px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 8,
              width: '100%',
              padding: sidebarCollapsed ? '8px 0' : '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-foreground)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-muted)'
              e.currentTarget.style.background = 'var(--color-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.background = 'var(--color-card)'
            }}
          >
            {theme === 'dark' ? <IcSun size={16} /> : <IcMoon size={16} />}
            {!sidebarCollapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
          </button>

          <Link
            to="/dashboard/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 10,
              marginTop: 14,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: profile.avatarColor || 'linear-gradient(135deg, var(--color-accent-violet), var(--color-accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {profile.avatarInitials || 'SL'}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {profile.email}
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: sidebarWidth, transition: 'margin 0.2s ease' }} className="max-md:!ml-0">
        {/* Mobile header */}
        <div
          className="md:hidden"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Logo size={30} fontSize={16} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--color-foreground)', cursor: 'pointer' }}
          >
            <IcMenu size={22} />
          </button>
        </div>

        <div key={pathname} className="page-transition-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
