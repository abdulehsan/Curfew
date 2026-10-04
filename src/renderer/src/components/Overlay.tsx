import React, { useState, useEffect } from 'react'
import type { EngineStatus } from '@shared/types'
import { AlertTriangle, Clock, ShieldAlert, Zap } from 'lucide-react'

export const Overlay: React.FC = () => {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [extensionMinutes, setExtensionMinutes] = useState<number>(15)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    window.api.getEngineStatus().then(setStatus).catch(console.error)
    const unsubscribe = window.api.onStateUpdated((newStatus) => {
      setStatus(newStatus)
      if (newStatus.state !== 'PROMPTING') {
        setErrorMessage(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const handleExtend = async (): Promise<void> => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await window.api.requestExtension({ minutes: extensionMinutes })
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isGrace ? (
              <ShieldAlert size={20} color="#ef4444" />
            ) : (
              <AlertTriangle size={20} color="#f59e0b" />
            )}
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: isGrace ? '#f87171' : '#fbbf24'
              }}
            >
              {isGrace ? 'FINAL NOTICE: SAVE PROGRESS' : 'FOCUS TIME EXPIRED'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
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
                  fontSize: '2.4rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: '#ef4444',
                  lineHeight: 1
                }}
              >
                {status.graceRemainingSec}s
              </div>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '6px' }}>
                Save your progress now! All target games will be safely closed.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '8px' }}>
                Daily budget reached. Take a break or extend your session:
              </p>
              {!strikesExhausted ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <Clock size={16} color="#94a3b8" />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={extensionMinutes}
                    onChange={(e) => setExtensionMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                    className="input"
                    style={{ width: '70px', textAlign: 'center', padding: '6px' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>min (max 30)</span>
                  <button
                    onClick={handleExtend}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    <Zap size={14} />
                    {isSubmitting ? 'Extending...' : `Extend (Strike ${status.strikeCount + 1}/3)`}
                  </button>
                </div>
              ) : (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                  All 3 strikes exhausted. Grace countdown will start immediately.
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
              {errorMessage}
            </p>
          )}
        </div>

        {/* Bottom Hint */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Target: {status.activeTarget?.name || status.activeProcess?.name || 'Active Game'}</span>
          <span>FocusContract Non-Invasive Protection</span>
        </div>
      </div>
    </div>
  )
}
