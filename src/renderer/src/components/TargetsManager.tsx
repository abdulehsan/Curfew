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
  Check,
  FolderOpen,
  FileCode,
  Sparkles,
  Gamepad2
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPickingFile, setIsPickingFile] = useState<boolean>(false)

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
    setSuccessMsg(null)
    const cleanExe = executable.trim().toLowerCase()
    if (!cleanExe) return

    if (!cleanExe.endsWith('.exe')) {
      setErrorMsg('Executable name must end with .exe (e.g. game.exe)')
      return
    }

    try {
      const updated = await window.api.addTarget({
        executable: cleanExe,
        name: name?.trim() || cleanExe.replace(/\.exe$/i, '')
      })
      onTargetsChange(updated)
      setManualExecutable('')
      setManualName('')
      setSuccessMsg(`Added ${name || cleanExe} to accountability targets!`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to add target')
    }
  }

  const handlePickFile = async (): Promise<void> => {
    setIsPickingFile(true)
    setErrorMsg(null)
    try {
      const picked = await window.api.pickExecutableFile()
      if (picked) {
        // Automatically add the picked executable
        await handleAddTarget(picked.executable, picked.name)
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to open file picker')
    } finally {
      setIsPickingFile(false)
    }
  }

  const handleRemoveTarget = async (executable: string): Promise<void> => {
    setErrorMsg(null)
    setSuccessMsg(null)
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
      {/* File Picker Hero Card */}
      <div className="file-picker-hero" onClick={handlePickFile}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(99, 102, 241, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.3)'
          }}
        >
          <FolderOpen size={28} color="#f43f5e" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>Pick Executable File (.exe)</span>
            <Sparkles size={16} color="#fb7185" />
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '460px' }}>
            Click here to browse your computer and select any game, launcher, or software executable to track automatically.
          </p>
        </div>
        <button
          type="button"
          disabled={isPickingFile}
          className="btn btn-primary"
          style={{ marginTop: '4px', pointerEvents: 'none' }}
        >
          <FolderOpen size={16} />
          {isPickingFile ? 'Selecting File...' : 'Browse Computer for .exe'}
        </button>
      </div>

      {/* Launcher vs Game Process Guidance */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
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
            Pro Tip: Game Launchers vs Game Engines (Valorant, Steam, Epic)
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Many modern games use a launcher (e.g. <code>RiotClientServices.exe</code>) separate from the actual game engine (e.g. <code>VALORANT-Win64-Shipping.exe</code>).
            Pick the actual gameplay executable or select it from the Running Process list below while the game is running.
          </p>
        </div>
      </div>

      {/* Target Application Accountability List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={18} color="var(--primary)" />
              Accountability Target List ({targets.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              These applications deduct from your daily budget and are gently protected by strikes.
            </p>
          </div>
        </div>

        {targets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <Gamepad2 size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>No targets configured yet</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Pick a file above or select a running game to begin practicing digital discipline.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {targets.map((target) => {
              const isBrowser = isBrowserExecutable(target.executable)
              return (
                <div
                  key={target.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>{target.name}</span>
                      <code
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--primary)',
                          background: 'rgba(244, 63, 94, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
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
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="var(--accent)" />
              Running Process Scanner
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Scan actively running Windows processes and add them with one click.
            </p>
          </div>

          <button
            onClick={fetchRunningProcesses}
            disabled={isLoadingProcesses}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isLoadingProcesses ? 'animate-spin' : ''} />
            Refresh List
          </button>
        </div>

        <div style={{ marginBottom: '14px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            type="text"
            placeholder="Filter processes (e.g. steam, valorant, chrome, discord, game)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>

        <div
          style={{
            maxHeight: '230px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          {filteredProcesses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
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
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: added ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${added ? 'rgba(16, 185, 129, 0.25)' : 'transparent'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{proc.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      PID: {proc.pid}
                    </span>
                  </div>

                  {added ? (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <Check size={14} /> Active Target
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddTarget(proc.name, proc.name.replace(/\.exe$/i, ''))}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    >
                      <Plus size={13} /> Track
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Executable name (e.g. cyberpunk2077.exe)"
            value={manualExecutable}
            onChange={(e) => setManualExecutable(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <input
            type="text"
            placeholder="Display name (optional, e.g. Cyberpunk 2077)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <button
            onClick={() => handleAddTarget(manualExecutable, manualName)}
            disabled={!manualExecutable.trim()}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Target
          </button>
        </div>

        {successMsg && (
          <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={15} /> {successMsg}
          </p>
        )}

        {errorMsg && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px' }}>
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  )
}
