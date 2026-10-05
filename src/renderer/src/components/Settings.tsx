import React, { useState } from 'react'
import type { AppConfig } from '@shared/types'
import {
  Sliders,
  Power,
  Shield,
  Clock,
  Coffee,
  CheckCircle2
} from 'lucide-react'

interface SettingsProps {
  config: AppConfig | null
  onConfigChange: (config: AppConfig) => void
}

export const Settings: React.FC<SettingsProps> = ({ config, onConfigChange }) => {
  const [dailyBudgetMinutes, setDailyBudgetMinutes] = useState<number>(
    config?.dailyBudgetMinutes ?? 60
  )
  const [idleThresholdSeconds, setIdleThresholdSeconds] = useState<number>(
    config?.idleThresholdSeconds ?? 120
  )
  const [autostart, setAutostart] = useState<boolean>(config?.autostart ?? true)
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSave = async (): Promise<void> => {
    setErrorMsg(null)
    setIsSaved(false)
    try {
      const updated = await window.api.updateConfig({
        dailyBudgetMinutes,
        idleThresholdSeconds,
        autostart
      })
      onConfigChange(updated)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update preferences')
    }
  }

  return (
    <div className="page-container">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--primary)" />
              Accountability & Budget Preferences
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Configure your daily time allowance, idle pause thresholds, and startup behavior.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Daily Budget Slider */}
          <div
            style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--primary)" />
                <label style={{ fontSize: '0.92rem', fontWeight: 700 }}>Daily Time Budget</label>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  background: 'rgba(244, 63, 94, 0.12)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(244, 63, 94, 0.25)'
                }}
              >
                {dailyBudgetMinutes} mins ({Math.floor(dailyBudgetMinutes / 60)}h {dailyBudgetMinutes % 60}m)
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={360}
              step={dailyBudgetMinutes < 15 ? 1 : 15}
              value={dailyBudgetMinutes}
              onChange={(e) => setDailyBudgetMinutes(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>1 min (Testing)</span>
              <span>1 Hour</span>
              <span>3 Hours</span>
              <span>6 Hours</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Baseline gaming and entertainment budget allocated each day. Resets automatically every midnight.
            </p>
          </div>

          {/* Idle Threshold */}
          <div
            style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={16} color="var(--accent)" />
                <label style={{ fontSize: '0.92rem', fontWeight: 700 }}>AFK Detection (Idle Pause Threshold)</label>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#818cf8',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  background: 'rgba(99, 102, 241, 0.12)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                {idleThresholdSeconds} seconds
              </span>
            </div>

            <input
              type="range"
              min={15}
              max={600}
              step={15}
              value={idleThresholdSeconds}
              onChange={(e) => setIdleThresholdSeconds(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '6px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>15s (Aggressive)</span>
              <span>2 Minutes</span>
              <span>5 Minutes</span>
              <span>10 Minutes</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              If no mouse or keyboard activity is registered for this duration, tracking automatically pauses so you don&apos;t burn time while grabbing water or on phone.
            </p>
          </div>

          {/* Autostart Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Power size={18} color="var(--success)" />
                Launch on Windows Startup (Recommended)
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Runs Curfew minimized to system tray silently upon Windows boot.
              </p>
            </div>

            <input
              type="checkbox"
              checked={autostart}
              onChange={(e) => setAutostart(e.target.checked)}
              style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              Save Preferences
            </button>

            {isSaved && (
              <span style={{ color: '#10b981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <CheckCircle2 size={18} /> Preferences updated and applied to engine!
              </span>
            )}

            {errorMsg && (
              <span style={{ color: '#ef4444', fontSize: '0.88rem' }}>
                {errorMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Honest Limits Notice */}
      <div
        className="glass-card"
        style={{
          borderLeft: '4px solid var(--primary)',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.6))'
        }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--primary)" />
          Self-Discipline Scope & Anti-Cheat Safe
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Curfew is designed for consenting adults practicing intentional focus. It does not install kernel rootkits or block Task Manager.
          Target shutdowns send polite <code>WM_CLOSE</code> requests so games and software can prompt to save cleanly before exit.
        </p>
      </div>
    </div>
  )
}
