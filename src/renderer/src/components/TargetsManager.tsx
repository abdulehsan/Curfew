import React, { useState, useEffect } from 'react'
import type { TargetApp, ProcessItem } from '@shared/types'
import { KNOWN_BROWSER_PROCESSES } from '@shared/constants'
import {
  Crosshair,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Info,
  Search,
  Check
} from 'lucide-react'

interface TargetsManagerProps {
  targets: TargetApp[]
  onTargetsChange: (targets: TargetApp[]) => void
}

export const TargetsManager: React.FC<TargetsManagerProps> = ({ targets, onTargetsChange }) => {
  const [runningProcesses, setRunningProcesses] = useState<ProcessItem[]>([])
  const [isLoadingProcesses, setIsLoadingProcesses] = useState<boolean>(false)
  const [manualExecutable, setManualExecutable] = useState<string>('')
  const [manualName, setManualName] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchRunningProcesses = async (): Promise<void> => {
    setIsLoadingProcesses(true)
    setErrorMsg(null)
    try {
      const procs = await window.api.getRunningProcesses()
      setRunningProcesses(procs)
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to enumerate running processes')
    } finally {
      setIsLoadingProcesses(false)
    }
  }

  useEffect(() => {
    fetchRunningProcesses()
  }, [])

  const handleAddTarget = async (executable: string, name?: string): Promise<void> => {
    setErrorMsg(null)
    const cleanExe = executable.trim().toLowerCase()
    if (!cleanExe) return

    if (!cleanExe.endsWith('.exe')) {
      setErrorMsg('Executable name must end in .exe (e.g. valorant-win64-shipping.exe)')
      return
    }

    try {
      const updated = await window.api.addTarget({
        executable: cleanExe,
        name: name?.trim() || cleanExe
      })
      onTargetsChange(updated)
      setManualExecutable('')
      setManualName('')
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to add target')
    }
  }

  const handleRemoveTarget = async (executable: string): Promise<void> => {
    setErrorMsg(null)
    try {
      const updated = await window.api.removeTarget({ executable })
      onTargetsChange(updated)
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to remove target')
    }
  }

  const filteredProcesses = runningProcesses.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const isAlreadyAdded = (exeName: string): boolean => {
    return targets.some((t) => t.executable.toLowerCase() === exeName.toLowerCase())
  }

  const isBrowserExecutable = (exe: string): boolean => {
    return KNOWN_BROWSER_PROCESSES.includes(
      exe.toLowerCase() as (typeof KNOWN_BROWSER_PROCESSES)[number]
    )
  }

  return (
    <div className="page-container">
      {/* Educational Note: Launcher vs Game Process */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}
      >
        <Info size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c7d2fe', marginBottom: '4px' }}>
            Launcher vs Game Process (Valorant, Steam, Epic)
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Many modern games use a launcher (e.g. <code>RiotClientServices.exe</code>) distinct from the actual game engine executable (e.g. <code>VALORANT-Win64-Shipping.exe</code>).
            We recommend selecting the actual game process from the running process picker below while the game is running.
          </p>
        </div>
      </div>

      {/* Target Application List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={18} color="var(--primary)" />
              Target Accountability List ({targets.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              These applications will count against your daily time budget and be protected by strikes.
            </p>
          </div>
        </div>

        {targets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            No targets configured yet. Add a game below to begin self-regulation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {targets.map((target) => {
              const isBrowser = isBrowserExecutable(target.executable)
              return (
                <div
                  key={target.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{target.name}</span>
                      <code style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {target.executable}
                      </code>
                    </div>

                    {isBrowser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#f59e0b', fontSize: '0.78rem' }}>
                        <AlertTriangle size={14} />
                        <span>Warning: Closing a web browser will close all open tabs and windows!</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveTarget(target.executable)}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    title="Remove from target list"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Running Process Picker */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Running Process Picker</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click to quickly add an actively running game or application.
            </p>
          </div>

          <button
            onClick={fetchRunningProcesses}
            disabled={isLoadingProcesses}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isLoadingProcesses ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search running processes (e.g. steam, game, valorant)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '38px' }}
          />
        </div>

        <div
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {filteredProcesses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              {isLoadingProcesses ? 'Scanning process list...' : 'No matching processes found'}
            </div>
          ) : (
            filteredProcesses.slice(0, 50).map((proc) => {
              const added = isAlreadyAdded(proc.name)
              return (
                <div
                  key={`${proc.pid}-${proc.name}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: added ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    border: '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{proc.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      PID: {proc.pid}
                    </span>
                  </div>

                  {added ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddTarget(proc.name, proc.name.replace(/\.exe$/i, ''))}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Plus size={12} /> Track
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
          Add Application Manually
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Executable name (e.g. steam.exe)"
            value={manualExecutable}
            onChange={(e) => setManualExecutable(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => handleAddTarget(manualExecutable, manualName)}
            disabled={!manualExecutable.trim()}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Target
          </button>
        </div>

        {errorMsg && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '10px' }}>
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  )
}
