import React, { useState, useEffect } from 'react'
import type { EngineStatus, AppConfig, TargetApp } from '@shared/types'
import { Dashboard } from './components/Dashboard'
import { TargetsManager } from './components/TargetsManager'
import { Settings } from './components/Settings'
import { HistoryChart } from './components/HistoryChart'
import { Overlay } from './components/Overlay'
import logoImg from './assets/logo.jpg'
import {
  LayoutDashboard,
  Crosshair,
  Sliders,
  Minus,
  X,
  Target,
  BarChart2
} from 'lucide-react'

export const App: React.FC = () => {
  const isOverlayMode = window.location.hash === '#overlay'

  const [activeTab, setActiveTab] = useState<'dashboard' | 'targets' | 'history' | 'settings'>('dashboard')
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [targets, setTargets] = useState<TargetApp[]>([])

  useEffect(() => {
    if (isOverlayMode) return
    if (!window.api) return

    window.api.getEngineStatus().then(setStatus).catch(console.error)
    window.api.getConfig().then(setConfig).catch(console.error)
    window.api.getTargets().then(setTargets).catch(console.error)

    const unsubscribe = window.api.onStateUpdated((newStatus) => {
      setStatus(newStatus)
    })

    return () => unsubscribe()
  }, [isOverlayMode])

  if (!window.api) {
    return (
      <div style={{ padding: '40px', color: '#f87171', fontFamily: 'sans-serif' }}>
        <h2>Curfew Bridge Connecting...</h2>
        <p>Waiting for Electron preload bridge...</p>
      </div>
    )
  }

  if (isOverlayMode) {
    return <Overlay />
  }

  const isTracking = status?.isTrackingActive
  const isGrace = status?.state === 'GRACE'
  const isLocked = status?.state === 'LOCKED'

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <img src={logoImg} alt="Curfew Logo" className="brand-logo-img" />
          </div>
          <div className="brand-info">
            <span className="brand-title">Curfew</span>
            <span className="brand-tag">Focus & Accountability</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`nav-item ${activeTab === 'targets' ? 'active' : ''}`}
          >
            <Crosshair size={18} />
            <span>Target Apps</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            <span>Usage History</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Sliders size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Live Status Card */}
        <div className="sidebar-status-card">
          <div className="live-beacon">
            <div
              className="beacon-dot"
              style={{
                background: isLocked ? '#ef4444' : isGrace ? '#f59e0b' : isTracking ? '#10b981' : '#64748b',
                boxShadow: isLocked
                  ? '0 0 10px #ef4444'
                  : isGrace
                    ? '0 0 10px #f59e0b'
                    : isTracking
                      ? '0 0 10px #10b981'
                      : 'none'
              }}
            />
            <span>
              {isLocked
                ? 'LOCKED OUT'
                : isGrace
                  ? `GRACE: ${status?.graceRemainingSec}s`
                  : isTracking
                    ? 'SESSION ACTIVE'
                    : 'GUARD STANDBY'}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: '2px' }}>
            {status?.activeTarget
              ? `Tracking: ${status.activeTarget.name}`
              : `${targets.length} target${targets.length === 1 ? '' : 's'} configured`}
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Custom Header Bar */}
        <header className="header-bar">
          <div className="header-title-badge">
            {activeTab === 'dashboard' && (
              <>
                <Target size={16} color="var(--primary)" />
                <span>Daily Accountability Dashboard</span>
              </>
            )}
            {activeTab === 'targets' && (
              <>
                <Crosshair size={16} color="var(--primary)" />
                <span>Target Applications & Games</span>
              </>
            )}
            {activeTab === 'history' && (
              <>
                <BarChart2 size={16} color="var(--accent)" />
                <span>Usage Statistics & 7-Day Trends</span>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <Sliders size={16} color="var(--accent)" />
                <span>Preferences & Time Budgets</span>
              </>
            )}
          </div>

          <div className="header-actions">
            <button
              onClick={() => window.api.minimizeWindow()}
              className="window-btn"
              title="Minimize"
            >
              <Minus size={15} />
            </button>
            <button
              onClick={() => window.api.closeWindow()}
              className="window-btn close"
              title="Minimize to System Tray"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <Dashboard status={status} config={config} />
        )}

        {activeTab === 'targets' && (
          <TargetsManager targets={targets} onTargetsChange={setTargets} />
        )}

        {activeTab === 'history' && (
          <div className="page-container">
            <HistoryChart />
          </div>
        )}

        {activeTab === 'settings' && (
          <Settings config={config} onConfigChange={setConfig} />
        )}
      </main>
    </div>
  )
}
