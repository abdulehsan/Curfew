import React from 'react'
import type { EngineStatus, AppConfig } from '@shared/types'
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Activity
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
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <Activity className="animate-spin" size={32} color="#f43f5e" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Connecting to FocusContract engine...</p>
        </div>
      </div>
    )
  }

  const isLocked = status.state === 'LOCKED'
  const isGrace = status.state === 'GRACE'
  const isTracking = status.isTrackingActive

  return (
    <div className="page-container">
      {/* Hero Timer Card */}
      <div className="glass-card hero-timer">
        <div className="timer-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="timer-label">Today&apos;s Remaining Time</span>
            <div
              className={`status-pill ${
                isLocked
                  ? 'locked'
                  : isGrace
                    ? 'grace'
                    : isTracking
                      ? 'tracking'
                      : 'prompting'
              }`}
            >
              {isLocked ? (
                <>
                  <ShieldAlert size={14} /> LOCKED
                </>
              ) : isGrace ? (
                <>
                  <Flame size={14} /> GRACE: {status.graceRemainingSec}s
                </>
              ) : isTracking ? (
                <>
                  <Activity size={14} /> TRACKING
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> STANDBY
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Budget: <strong>{config?.dailyBudgetMinutes || 60}m</strong> / day
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Playtime Today: <strong>{formatDuration(status.totalTodayUsageMs)}</strong>
            </span>
          </div>
        </div>

        {/* Strikes Meter */}
        <div className="strikes-container">
          <span className="strikes-label">Strikes Used ({status.strikeCount}/3)</span>
          <div className="strike-badges">
            {[1, 2, 3].map((strikeIndex) => (
              <div
                key={strikeIndex}
                className={`strike-pip ${status.strikeCount >= strikeIndex ? 'used' : ''}`}
                title={`Strike ${strikeIndex}`}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            {status.strikeCount >= 3
              ? 'No extensions left today'
              : `${3 - status.strikeCount} extensions remaining`}
          </span>
        </div>
      </div>

      {/* Realtime Status Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: isTracking
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isTracking ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
            }}
          >
            {isTracking ? (
              <Activity size={22} color="#10b981" />
            ) : (
              <Clock size={22} color="#94a3b8" />
            )}
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {status.activeTarget
                ? `Foreground: ${status.activeTarget.name}`
                : 'No target application in foreground'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {status.isSystemIdle
                ? 'System idle threshold exceeded (time deduction paused)'
                : isTracking
                  ? 'Active session: budget time is currently deducting'
                  : 'Time deduction is paused until a target game is active'}
            </p>
          </div>
        </div>

        {status.activeProcess && (
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}
          >
            PID: {status.activeProcess.pid} | {status.activeProcess.name}
          </div>
        )}
      </div>

      {/* Today's Usage Breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" />
          Today&apos;s Application Breakdown
        </h3>

        {Object.keys(status.todayUsageMs).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
            No target application activity recorded yet today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exe}</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {formatDuration(ms)} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))'
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
