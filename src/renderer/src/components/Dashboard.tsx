import React from 'react'
import type { EngineStatus, AppConfig } from '@shared/types'
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Activity,
  Gamepad2,
  PauseCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardProps {
  status: EngineStatus | null
  config: AppConfig | null
}

function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export const Dashboard: React.FC<DashboardProps> = ({ status, config }) => {
  if (!status) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Activity className="animate-spin" size={36} color="#f43f5e" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Initializing Curfew Engine</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Synchronizing local state with process sentinel...</p>
        </div>
      </div>
    )
  }

  const isLocked = status.state === 'LOCKED'
  const isGrace = status.state === 'GRACE'
  const isTracking = status.isTrackingActive
  const budgetMs = (config?.dailyBudgetMinutes || 60) * 60 * 1000
  const progressPercent = Math.max(0, Math.min(100, Math.round((status.remainingMs / budgetMs) * 100)))

  return (
    <div className="page-container">
      {/* Hero Timer Card */}
      <div className="glass-card hero-timer">
        <div className="timer-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="timer-label">Today&apos;s Budget Remaining</span>
            <div
              className={`status-pill ${
                isLocked
                  ? 'locked'
                  : isGrace
                    ? 'grace'
                    : isTracking
                      ? 'tracking'
                      : 'standby'
              }`}
            >
              {isLocked ? (
                <>
                  <ShieldAlert size={14} /> SYSTEM LOCKED
                </>
              ) : isGrace ? (
                <>
                  <Flame size={14} /> GRACE: {status.graceRemainingSec}s
                </>
              ) : isTracking ? (
                <>
                  <Activity size={14} /> ACTIVE TRACKING
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> STANDBY GUARD
                </>
              )}
            </div>
          </div>

          <div
            className={`timer-value ${
              isLocked ? 'locked' : isGrace ? 'grace' : isTracking ? 'active' : ''
            }`}
          >
            {formatRemainingTime(status.remainingMs)}
          </div>

          {/* Budget Progress Bar */}
          <div style={{ width: '100%', maxWidth: '420px', marginTop: '4px' }}>
            <div
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: isGrace
                    ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                    : isLocked
                      ? '#ef4444'
                      : 'linear-gradient(90deg, var(--primary), var(--accent))',
                  boxShadow: '0 0 10px var(--primary-glow)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>{progressPercent}% of budget available</span>
              <span>Total Used: <strong>{formatDuration(status.totalTodayUsageMs)}</strong></span>
            </div>
          </div>
        </div>

        {/* Strikes Cyber Indicators */}
        <div className="strikes-container">
          <span className="strikes-label">Strikes & Extensions ({status.strikeCount}/3)</span>
          <div className="strike-badges">
            {[1, 2, 3].map((strikeIndex) => {
              const isUsed = status.strikeCount >= strikeIndex
              return (
                <div
                  key={strikeIndex}
                  className={`strike-cell ${isUsed ? 'used' : ''}`}
                  title={`Strike ${strikeIndex}: ${isUsed ? 'Exhausted' : 'Available'}`}
                >
                  {isUsed ? `X${strikeIndex}` : `S${strikeIndex}`}
                </div>
              )
            })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            {status.strikeCount >= 3
              ? 'No extensions left today'
              : `${3 - status.strikeCount} extensions remaining`}
          </span>
        </div>
      </div>

      {/* Real-time Sentinel Active Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderLeft: isTracking
            ? '4px solid #10b981'
            : isGrace
              ? '4px solid #ef4444'
              : '4px solid var(--border-color)',
          background: isTracking
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.6))'
            : 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: isTracking
                ? 'rgba(16, 185, 129, 0.18)'
                : 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isTracking ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
              boxShadow: isTracking ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none'
            }}
          >
            {isTracking ? (
              <Gamepad2 size={24} color="#10b981" />
            ) : status.isSystemIdle ? (
              <PauseCircle size={24} color="#f59e0b" />
            ) : (
              <Clock size={24} color="#94a3b8" />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {status.activeTarget
                  ? `Active Foreground: ${status.activeTarget.name}`
                  : 'No Target App In Foreground'}
              </h4>
              {isTracking && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: '#10b981',
                    color: '#000',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  LIVE DEDUCTING
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              {status.isSystemIdle
                ? 'System idle threshold exceeded: AFK detection paused time deduction'
                : isTracking
                  ? 'Game active in foreground: time budget deducting per tick'
                  : 'Curfew is monitoring foreground windows. Timer resumes when a target app is focused.'}
            </p>
          </div>
        </div>

        {status.activeProcess && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>PID {status.activeProcess.pid}</span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span>{status.activeProcess.name}</span>
          </div>
        )}
      </div>

      {/* Today's Usage Breakdown */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary)" />
            Today&apos;s Application Breakdown
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Reset every midnight (00:00:00)
          </span>
        </div>

        {Object.keys(status.todayUsageMs).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <AlertCircle size={28} color="var(--text-dim)" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No Target Application Activity Recorded Today</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Launch any of your tracked games or apps to begin logging time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(status.todayUsageMs).map(([exe, ms]) => {
              const pct =
                status.totalTodayUsageMs > 0
                  ? Math.round((ms / status.totalTodayUsageMs) * 100)
                  : 0

              return (
                <div
                  key={exe}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gamepad2 size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{exe}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontWeight: 600 }}>
                      {formatDuration(ms)} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        boxShadow: '0 0 8px var(--primary-glow)',
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
