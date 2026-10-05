import React, { useState, useEffect } from 'react'
import type { EngineStatus } from '@shared/types'
import { AlertTriangle, Clock, Zap, Flame, Shield, Timer } from 'lucide-react'

export const Overlay: React.FC = () => {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [extensionMinutes, setExtensionMinutes] = useState<number>(5)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!window.api) return
    window.api.getEngineStatus().then(setStatus).catch(console.error)
    const unsubscribe = window.api.onStateUpdated((newStatus) => {
      setStatus(newStatus)
      if (newStatus.state !== 'PROMPTING') {
        setErrorMessage(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const handleExtend = async (mins: number): Promise<void> => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await window.api.requestExtension({ minutes: mins })
      if (!res.success && res.error) {
        setErrorMessage(res.error)
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Extension failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!status) return null

  const isGrace = status.state === 'GRACE'
  const strikesExhausted = status.strikeCount >= status.maxStrikes

  return (
    <div className="overlay-container">
      <div className={`overlay-box ${isGrace ? 'grace' : ''}`}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isGrace ? (
              <Flame size={20} color="#ef4444" className="animate-bounce" />
            ) : (
              <AlertTriangle size={20} color="#f59e0b" />
            )}
            <div>
              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: isGrace ? '#fca5a5' : '#fbbf24'
                }}
              >
                {isGrace ? 'FINAL NOTICE: SAVE PROGRESS' : 'CURFEW: BUDGET EXPIRED'}
              </span>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
                Curfew Safe Enforcement Sentinel
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: isGrace ? '#ef4444' : '#fbbf24',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              Strikes: {status.strikeCount}/{status.maxStrikes}
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div style={{ margin: '8px 0', textAlign: 'center' }}>
          {isGrace ? (
            <div>
              <div
                style={{
                  fontSize: '2.8rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.6))'
                }}
              >
                {status.graceRemainingSec}s
              </div>
              <p style={{ fontSize: '0.88rem', color: '#fecaca', marginTop: '6px', fontWeight: 600 }}>
                Save your progress immediately! Safe shutdown in progress.
              </p>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                At 0s, active target games will receive a standard WM_CLOSE signal.
              </p>
            </div>
          ) : (
            <div>
              {/* 100-Second Decision Window Countdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '6px'
                }}
              >
                <Timer size={14} color={status.graceRemainingSec <= 30 ? '#ef4444' : '#f59e0b'} />
                <span style={{ fontSize: '0.80rem', color: '#94a3b8' }}>
                  Auto-closing game in:
                </span>
                <span
                  style={{
                    fontSize: '0.90rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: status.graceRemainingSec <= 30 ? '#ef4444' : '#fbbf24',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${
                      status.graceRemainingSec <= 30
                        ? 'rgba(239, 68, 68, 0.4)'
                        : 'rgba(251, 191, 36, 0.3)'
                    }`
                  }}
                >
                  {status.graceRemainingSec}s
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
                Extend (max 10m) within 100s, or target game will automatically close:
              </p>

              {!strikesExhausted ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {/* Quick Preset Buttons (Max 10m) */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[2, 5, 10].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleExtend(mins)}
                        disabled={isSubmitting}
                        className="btn btn-secondary"
                        style={{ padding: '5px 14px', fontSize: '0.82rem' }}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>

                  {/* Custom Extension Input + Submit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} color="#94a3b8" />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={extensionMinutes}
                      onChange={(e) =>
                        setExtensionMinutes(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))
                      }
                      className="input"
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.82rem' }}
                    />
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>min</span>
                    <button
                      onClick={() => handleExtend(extensionMinutes)}
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ padding: '5px 12px', fontSize: '0.80rem' }}
                    >
                      <Zap size={13} />
                      {isSubmitting ? 'Extending...' : `Extend (Strike ${status.strikeCount + 1}/${status.maxStrikes})`}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <p style={{ color: '#ef4444', fontSize: '0.84rem', fontWeight: 700, margin: 0 }}>
                    All strikes exhausted. Game will close at 0s.
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p style={{ color: '#ef4444', fontSize: '0.80rem', marginTop: '6px', margin: '4px 0 0 0' }}>
              {errorMessage}
            </p>
          )}
        </div>

        {/* Bottom Target Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '8px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={12} color="var(--primary)" />
            Target: <strong>{status.activeTarget?.name || status.activeProcess?.name || 'Active Game'}</strong>
          </span>
          <span>Curfew Guard</span>
        </div>
      </div>
    </div>
  )
}
