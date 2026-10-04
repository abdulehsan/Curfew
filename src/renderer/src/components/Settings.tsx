import React, { useState } from 'react'
import type { AppConfig } from '@shared/types'
import {
  Sliders,
  Power,
  Shield,
  Check
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
      setTimeout(() => setIsSaved(false), 2500)
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update settings')
    }
  }

  return (
    <div className="page-container">
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--primary)" />
          Accountability Preferences
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Daily Budget */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Daily Time Budget</label>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                {dailyBudgetMinutes} minutes ({Math.floor(dailyBudgetMinutes / 60)}h {dailyBudgetMinutes % 60}m)
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={480}
              step={15}
              value={dailyBudgetMinutes}
              onChange={(e) => setDailyBudgetMinutes(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total baseline budget allocated each day. Resets every midnight.
            </p>
          </div>

          {/* Idle Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>System Idle Pause Threshold</label>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
                {idleThresholdSeconds} seconds
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={600}
              step={30}
              value={idleThresholdSeconds}
              onChange={(e) => setIdleThresholdSeconds(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              If no keyboard/mouse input is detected for this duration, tracking automatically pauses (AFK protection).
            </p>
          </div>

          {/* Autostart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Power size={16} color="var(--success)" />
                Launch on Windows Startup
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Automatically starts FocusContract minimized to tray when you boot your PC.
              </p>
            </div>

            <input
              type="checkbox"
              checked={autostart}
              onChange={(e) => setAutostart(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
            <button onClick={handleSave} className="btn btn-primary">
              Save Preferences
            </button>

            {isSaved && (
              <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> Preferences updated successfully!
              </span>
            )}

            {errorMsg && (
              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                {errorMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Honest Limits Card */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--primary)" />
          Digital Self-Regulation Scope
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          FocusContract is built as an accountability partner for self-directed discipline. It does not install intrusive rootkits or prevent Task Manager termination.
          Target closure sends standard Windows <code>WM_CLOSE</code> requests, giving games time to save before clean termination.
        </p>
      </div>
    </div>
  )
}
