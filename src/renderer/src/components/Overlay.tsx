import React, { useState, useEffect } from 'react'
import type { EngineStatus } from '@shared/types'
import { AlertTriangle, Clock, Zap, Flame, Shield } from 'lucide-react'

export const Overlay: React.FC = () => {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [extensionMinutes, setExtensionMinutes] = useState<number>(15)
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
              <Flame size={22} color="#ef4444" className="animate-bounce" />
            ) : (
              <AlertTriangle size={22} color="#f59e0b" />
            )}
            <div>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: isGrace ? '#fca5a5' : '#fbbf24'
                }}
              >
                {isGrace ? 'FINAL NOTICE: SAVE YOUR PROGRESS' : 'FOCUS CONTRACT: BUDGET EXPIRED'}
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
                Curfew Non-Invasive Enforcement Sentinel
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
        <div style={{ margin: '12px 0', textAlign: 'center' }}>
          {isGrace ? (
            <div>
              <div
                style={{
                  fontSize: '3.2rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.6))'
                }}
              >
                {status.graceRemainingSec}s
              </div>
              <p style={{ fontSize: '0.92rem', color: '#fecaca', marginTop: '8px', fontWeight: 600 }}>
                Save your progress immediately! Safe shutdown in progress.
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                At 0s, active target games will receive a standard WM_CLOSE signal.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.92rem', color: '#e2e8f0', marginBottom: '12px' }}>
                Your daily gaming budget has reached zero. Choose an extension:
              </p>

              {!strikesExhausted ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[5, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleExtend(mins)}
                        disabled={isSubmitting}
                        className="btn btn-secondary"
                        style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <Clock size={15} color="#94a3b8" />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={extensionMinutes}
                      onChange={(e) =>
                        setExtensionMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))
                      }
                      className="input"
                      style={{ width: '64px', textAlign: 'center', padding: '4px 8px', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>min</span>
                    <button
                      onClick={() => handleExtend(extensionMinutes)}
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <Zap size={14} />
                      {isSubmitting ? 'Extending...' : `Extend (Strike ${status.strikeCount + 1}/3)`}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <p style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 700 }}>
                    All 3 strikes exhausted. Grace countdown starting.
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '8px' }}>
              {errorMessage}
            </p>
          )}
        </div>

        {/* Bottom Hint */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={13} color="var(--primary)" />
            Target: <strong>{status.activeTarget?.name || status.activeProcess?.name || 'Active Game'}</strong>
          </span>
          <span>Curfew Windows Guard</span>
        </div>
      </div>
    </div>
  )
}
