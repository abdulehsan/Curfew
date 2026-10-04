import React, { useState, useEffect } from 'react'
import type { EngineStatus, AppConfig, TargetApp } from '@shared/types'
import { Dashboard } from './components/Dashboard'
import { TargetsManager } from './components/TargetsManager'
import { Settings } from './components/Settings'
import { HistoryChart } from './components/HistoryChart'
import { Overlay } from './components/Overlay'
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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Target size={20} />
          </div>
          <div>
            <div className="brand-title">Curfew</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              SELF DISCIPLINE v0.1
            </div>
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
            <span>Target Games</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Sliders size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Engine Active
          </div>
          <div style={{ marginTop: '4px' }}>
            Non-invasive process guard
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Custom Header Bar */}
        <header className="header-bar">
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {activeTab === 'dashboard' && 'Daily Accountability Dashboard'}
            {activeTab === 'targets' && 'Tracked Applications & Games'}
            {activeTab === 'history' && 'Usage Statistics & Trends'}
            {activeTab === 'settings' && 'App Settings & Budgets'}
          </div>

          <div className="header-actions">
            <button
              onClick={() => window.api.minimizeWindow()}
              className="window-btn"
              title="Minimize"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => window.api.closeWindow()}
              className="window-btn close"
              title="Minimize to Tray"
            >
              <X size={16} />
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
