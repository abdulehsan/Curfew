import path from 'path'
import type {
  Clock,
  WindowProvider,
  ProcessProvider,
  IdleProvider,
  ProcessKiller,
  NotificationProvider,
  ProcessInfo
} from '../platform/interfaces'
import type { AppStore } from '../store'
import type {
  EngineState,
  EngineConfig,
  StateMachineResult
} from './types'
import {
  handleTick,
  handleRequestExtension,
  createInitialState
} from './stateMachine'
import type { TargetApp, EngineStatus, AppConfig } from '@shared/types'
import {
  TICK_INTERVAL_MS,
  MAX_TICK_DELTA_MS,
  PERSIST_INTERVAL_MS,
  MAX_STRIKES,
  MAX_EXTENSION_MIN,
  GRACE_SECONDS
} from '@shared/constants'

export type StateListener = (status: EngineStatus) => void

export class FocusEngine {
  private state: EngineState
  private lastTickTimestamp: number
  private lastPersistTimestamp: number
  private timer: NodeJS.Timeout | null = null
  private isSuspended = false
  private isSessionLocked = false
  private listeners: Set<StateListener> = new Set()
  private knownPidsToIgnore: Set<number> = new Set()
  private lastBackoffNotificationTime = 0

  constructor(
    private clock: Clock,
    private windowProvider: WindowProvider,
    private processProvider: ProcessProvider,
    private idleProvider: IdleProvider,
    private processKiller: ProcessKiller,
    private notificationProvider: NotificationProvider,
    private store: AppStore,
    private config: AppConfig
  ) {
    const today = this.clock.today()
    const storedToday = this.store.getTodayState()

    // Restore stored state if today matches, else create fresh state
    if (storedToday && storedToday.date === today) {
      this.state = {
        state: storedToday.state,
        remainingMs: storedToday.remainingMs,
        strikeCount: storedToday.strikeCount,
        graceRemainingSec: storedToday.graceRemainingSec ?? GRACE_SECONDS,
        lastResetDate: storedToday.date,
        todayUsageMs: {}
      }
    } else {
      this.state = createInitialState(today, this.config.dailyBudgetMinutes)
    }

    this.lastTickTimestamp = this.clock.now()
    this.lastPersistTimestamp = this.clock.now()
  }

  start(): void {
    if (this.timer) return
    this.lastTickTimestamp = this.clock.now()
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[FocusEngine] Error during tick:', err)
      })
    }, TICK_INTERVAL_MS)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.persist(true)
  }

  setSuspended(suspended: boolean): void {
    this.isSuspended = suspended
    if (suspended) {
      this.persist(true)
    } else {
      // Upon resume, reset tick time so delta is not huge
      this.lastTickTimestamp = this.clock.now()
    }
  }

  setSessionLocked(locked: boolean): void {
    this.isSessionLocked = locked
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    listener(this.getStatus(null, null, false, false))
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(
    activeTarget: TargetApp | null,
    activeProcess: ProcessInfo | null,
    isTrackingActive: boolean,
    isSystemIdle: boolean
  ): void {
    const status = this.getStatus(activeTarget, activeProcess, isTrackingActive, isSystemIdle)
    for (const listener of this.listeners) {
      try {
        listener(status)
      } catch (err) {
        console.error('[FocusEngine] Listener error:', err)
      }
    }
  }

  getStatus(
    activeTarget: TargetApp | null,
    activeProcess: ProcessInfo | null,
    isTrackingActive: boolean,
    isSystemIdle: boolean
  ): EngineStatus {
    let totalMs = 0
    for (const ms of Object.values(this.state.todayUsageMs)) {
      totalMs += ms
    }

    return {
      state: this.state.state,
      remainingMs: this.state.remainingMs,
      strikeCount: this.state.strikeCount,
      maxStrikes: MAX_STRIKES,
      graceRemainingSec: this.state.graceRemainingSec,
      activeTarget,
      activeProcess: activeProcess
        ? {
            pid: activeProcess.pid,
            name: activeProcess.name,
            windowTitle: activeProcess.windowTitle
          }
        : null,
      isTrackingActive,
      isSystemIdle,
      todayUsageMs: { ...this.state.todayUsageMs },
      totalTodayUsageMs: totalMs,
      date: this.state.lastResetDate
    }
  }

  getState(): EngineState {
    return { ...this.state }
  }

  getConfig(): AppConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.store.updateConfig(this.config)
  }

  requestExtension(minutes: number): { success: boolean; error?: string } {
    const engineConfig: EngineConfig = {
      dailyBudgetMinutes: this.config.dailyBudgetMinutes,
      maxStrikes: MAX_STRIKES,
      maxExtensionMinutes: MAX_EXTENSION_MIN,
      graceSeconds: GRACE_SECONDS
    }

    const result = handleRequestExtension(this.state, minutes, engineConfig)
    if (result.effects.error) {
      return { success: false, error: result.effects.error }
    }

    this.state = result.nextState
    this.persist(true)
    this.notifyListeners(null, null, false, false)
    return { success: true }
  }

  async tick(): Promise<void> {
    const now = this.clock.now()
    const rawDelta = now - this.lastTickTimestamp
    this.lastTickTimestamp = now

    // Clamp deltaMs to MAX_TICK_DELTA_MS (5000ms) as per spec
    const deltaMs = Math.min(Math.max(0, rawDelta), MAX_TICK_DELTA_MS)

    const currentDate = this.clock.today()
    const targets = this.store.getTargets()

    // 1. Query all running processes (tasklist.exe)
    const runningProcesses = await this.processProvider.getRunningProcesses()
    const targetRunningProcesses = runningProcesses.filter((proc) =>
      targets.some((t) => t.executable.toLowerCase() === proc.name.toLowerCase())
    )
    const hasRunningTargets = targetRunningProcesses.length > 0

    // 2. Query active foreground window (active-win or native user32 fallback)
    const activeWin = await this.windowProvider.getActiveWindow()

    // Determine foreground executable:
    // If activeWin has a PID, match it against runningProcesses (from tasklist.exe)
    let activeExecutable = activeWin?.name?.toLowerCase() || ''
    if (activeWin?.pid && (!activeExecutable || !activeExecutable.endsWith('.exe'))) {
      const matchFromPid = runningProcesses.find((p) => p.pid === activeWin.pid)
      if (matchFromPid) {
        activeExecutable = matchFromPid.name.toLowerCase()
      }
    }

    // Next, check path if available
    if (activeWin?.path && (!activeExecutable || !activeExecutable.endsWith('.exe'))) {
      activeExecutable = path.basename(activeWin.path).toLowerCase()
    }

    // 3. Multi-layer Target Matcher (anti-cheat safe, supports launchers & descriptions)
    let matchedTarget: TargetApp | null = null

    if (activeExecutable || activeWin) {
      matchedTarget =
        targets.find((t) => {
          const targetExe = t.executable.toLowerCase()
          const targetBase = targetExe.replace(/\.exe$/i, '')
          const targetDisplayName = t.name.toLowerCase().trim()

          // A. Direct executable match (e.g. valorant-win64-shipping.exe)
          if (
            activeExecutable &&
            (targetExe === activeExecutable ||
              targetBase === activeExecutable.replace(/\.exe$/i, '') ||
              targetExe === `${activeExecutable}.exe`)
          ) {
            return true
          }

          // B. ActiveWin raw name match (e.g. "VALORANT" or "VALORANT.exe")
          if (activeWin?.name) {
            const rawName = activeWin.name.toLowerCase().trim()
            if (
              targetExe === rawName ||
              targetBase === rawName.replace(/\.exe$/i, '') ||
              targetExe === `${rawName}.exe`
            ) {
              return true
            }
          }

          // C. ActiveWin path match
          if (activeWin?.path) {
            const pathExe = path.basename(activeWin.path).toLowerCase()
            if (targetExe === pathExe || targetBase === pathExe.replace(/\.exe$/i, '')) {
              return true
            }
          }

          // D. Window Title match (e.g. Window title is "VALORANT  " or "Brawlhalla")
          if (activeWin?.title && activeWin.title.trim().length > 0) {
            const titleLower = activeWin.title.toLowerCase().trim()
            if (
              titleLower.includes(targetBase) ||
              (targetDisplayName && titleLower.includes(targetDisplayName)) ||
              (targetBase === 'valorant' && titleLower.startsWith('valorant')) ||
              (targetBase === 'valorant-win64-shipping' && titleLower.startsWith('valorant')) ||
              (targetBase === 'brawlhalla' && titleLower.includes('brawlhalla'))
            ) {
              // Ensure this is backed by an actively running target process or activeWin PID
              const isTargetRunning = targetRunningProcesses.some(
                (p) => p.name.toLowerCase() === targetExe || (activeWin.pid && p.pid === activeWin.pid)
              )
              if (isTargetRunning) {
                return true
              }
            }
          }

          return false
        }) || null
    }

    const isTargetForeground = !!matchedTarget

    // 4. Query idle state
    const idleSeconds = this.idleProvider.getIdleTimeSec()
    const isSystemIdle = idleSeconds >= this.config.idleThresholdSeconds

    const isTrackingActive =
      isTargetForeground &&
      !isSystemIdle &&
      !this.isSuspended &&
      !this.isSessionLocked &&
      (this.state.state === 'IDLE_BUDGET' || this.state.state === 'EXTENDED')

    // 5. Run State Machine Reducer
    const engineConfig: EngineConfig = {
      dailyBudgetMinutes: this.config.dailyBudgetMinutes,
      maxStrikes: MAX_STRIKES,
      maxExtensionMinutes: MAX_EXTENSION_MIN,
      graceSeconds: GRACE_SECONDS
    }

    const result: StateMachineResult = handleTick(
      this.state,
      {
        deltaMs,
        isTargetForeground,
        isSystemIdle,
        isSessionSuspended: this.isSuspended || this.isSessionLocked,
        activeExecutable: matchedTarget?.executable || activeExecutable || null,
        hasRunningTargets,
        currentDate
      },
      engineConfig
    )

    this.state = result.nextState

    // 6. Handle Side Effects
    if (result.effects.didDailyReset) {
      console.log(`[FocusEngine] Daily reset executed for date ${currentDate}`)
      this.persist(true)
    }

    if (result.effects.shouldNotifyGrace !== undefined) {
      const sec = result.effects.shouldNotifyGrace
      this.notificationProvider.send(
        'Curfew Warning',
        `Save your progress! Target applications will close in ${sec} seconds.`
      )
    }

    if (result.effects.shouldCloseTargets || this.state.state === 'LOCKED') {
      await this.enforceProcessClosure(targetRunningProcesses)
    }

    // 7. Periodic Persistence
    if (now - this.lastPersistTimestamp >= PERSIST_INTERVAL_MS) {
      this.persist(false)
      this.lastPersistTimestamp = now
    }

    // 8. Notify listeners (UI)
    const activeProcInfo: ProcessInfo | null =
      activeWin && matchedTarget
        ? {
            pid: activeWin.pid,
            name: activeExecutable || activeWin.name || matchedTarget.executable,
            windowTitle: activeWin.title
          }
        : null

    this.notifyListeners(matchedTarget, activeProcInfo, isTrackingActive, isSystemIdle)
  }

  /**
   * Enforce closure of running target processes
   * Ladder: graceful WM_CLOSE -> wait up to 3s -> force kill PID tree
   */
  private async enforceProcessClosure(runningTargets: ProcessInfo[]): Promise<void> {
    for (const proc of runningTargets) {
      if (this.knownPidsToIgnore.has(proc.pid)) {
        continue
      }

      console.log(`[FocusEngine] Enforcing termination for ${proc.name} (PID: ${proc.pid})`)
      const success = await this.processKiller.closeGracefully(proc.pid)

      if (!success) {
        // Fallback to force kill after short delay
        const forceSuccess = await this.processKiller.forceKill(proc.pid)
        if (!forceSuccess) {
          // If denied, back off to avoid tight retry loop
          this.knownPidsToIgnore.add(proc.pid)
          const now = this.clock.now()
          if (now - this.lastBackoffNotificationTime > 10000) {
            this.lastBackoffNotificationTime = now
            this.notificationProvider.send(
              'Enforcement Notice',
              `Could not close ${proc.name} (PID ${proc.pid}). Please close it manually or run as administrator.`
            )
          }
        }
      }
    }
  }

  persist(force: boolean = false): void {
    try {
      this.store.saveTodayState({
        date: this.state.lastResetDate,
        remainingMs: this.state.remainingMs,
        strikeCount: this.state.strikeCount,
        state: this.state.state,
        graceRemainingSec: this.state.graceRemainingSec,
        lastTickTime: this.clock.now()
      })

      let total = 0
      for (const ms of Object.values(this.state.todayUsageMs)) {
        total += ms
      }

      this.store.recordDailyUsage({
        date: this.state.lastResetDate,
        appUsageMs: { ...this.state.todayUsageMs },
        totalUsageMs: total
      })

      if (force) {
        this.lastPersistTimestamp = this.clock.now()
      }
    } catch (err) {
      console.error('[FocusEngine] Failed to persist state:', err)
    }
  }
}
