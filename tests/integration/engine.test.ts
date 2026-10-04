import { describe, it, expect, beforeEach } from 'vitest'
import { FocusEngine } from '../../src/main/engine/engine'
import type {
  Clock,
  WindowProvider,
  ProcessProvider,
  IdleProvider,
  ProcessKiller,
  NotificationProvider,
  ProcessInfo,
  ActiveWindowInfo
} from '../../src/main/platform/interfaces'
import type { AppStore } from '../../src/main/store'
import type { AppConfig, TargetApp, TodayState, DailyUsageRecord } from '@shared/types'

class FakeClock implements Clock {
  private currentMs: number
  private currentDate: string

  constructor(initialDate: string = '2026-10-05', initialMs: number = 1700000000000) {
    this.currentDate = initialDate
    this.currentMs = initialMs
  }

  now(): number {
    return this.currentMs
  }

  today(): string {
    return this.currentDate
  }

  advance(ms: number): void {
    this.currentMs += ms
  }

  setDate(date: string): void {
    this.currentDate = date
  }
}

class FakeWindowProvider implements WindowProvider {
  private activeWindow: ActiveWindowInfo | null = null

  async getActiveWindow(): Promise<ActiveWindowInfo | null> {
    return this.activeWindow
  }

  setActiveWindow(win: ActiveWindowInfo | null): void {
    this.activeWindow = win
  }
}

class FakeProcessProvider implements ProcessProvider {
  private processes: ProcessInfo[] = []

  async getRunningProcesses(): Promise<ProcessInfo[]> {
    return [...this.processes]
  }

  setProcesses(procs: ProcessInfo[]): void {
    this.processes = [...procs]
  }
}

class FakeIdleProvider implements IdleProvider {
  private idleSec = 0

  getIdleTimeSec(): number {
    return this.idleSec
  }

  setIdleTimeSec(sec: number): void {
    this.idleSec = sec
  }
}

class FakeProcessKiller implements ProcessKiller {
  public killedPids: { pid: number; mode: 'graceful' | 'force' }[] = []
  public shouldFailGraceful = false

  async closeGracefully(pid: number): Promise<boolean> {
    this.killedPids.push({ pid, mode: 'graceful' })
    return !this.shouldFailGraceful
  }

  async forceKill(pid: number): Promise<boolean> {
    this.killedPids.push({ pid, mode: 'force' })
    return true
  }
}

class FakeNotificationProvider implements NotificationProvider {
  public notifications: { title: string; body: string }[] = []

  send(title: string, body: string): void {
    this.notifications.push({ title, body })
  }
}

class InMemoryAppStore {
  public targets: TargetApp[] = []
  public config: AppConfig = {
    dailyBudgetMinutes: 1, // 1 min for fast testing
    idleThresholdSeconds: 120,
    autostart: true
  }
  public todayState: TodayState | null = null
  public history: DailyUsageRecord[] = []

  getConfig(): AppConfig {
    return { ...this.config }
  }

  updateConfig(partial: Partial<AppConfig>): AppConfig {
    this.config = { ...this.config, ...partial }
    return this.config
  }

  getTargets(): TargetApp[] {
    return [...this.targets]
  }

  setTargets(targets: TargetApp[]): void {
    this.targets = [...targets]
  }

  getTodayState(): TodayState {
    if (!this.todayState) {
      return {
        date: '2026-10-05',
        remainingMs: this.config.dailyBudgetMinutes * 60000,
        strikeCount: 0,
        state: 'IDLE_BUDGET',
        graceRemainingSec: 100,
        lastTickTime: 0
      }
    }
    return { ...this.todayState }
  }

  saveTodayState(today: TodayState): void {
    this.todayState = { ...today }
  }

  getHistory(): DailyUsageRecord[] {
    return [...this.history]
  }

  recordDailyUsage(record: DailyUsageRecord): void {
    const idx = this.history.findIndex((h) => h.date === record.date)
    if (idx >= 0) {
      this.history[idx] = record
    } else {
      this.history.push(record)
    }
  }
}

describe('FocusEngine Integration with Fake Providers', () => {
  let clock: FakeClock
  let windowProvider: FakeWindowProvider
  let processProvider: FakeProcessProvider
  let idleProvider: FakeIdleProvider
  let killer: FakeProcessKiller
  let notifier: FakeNotificationProvider
  let store: InMemoryAppStore
  let engine: FocusEngine

  beforeEach(() => {
    clock = new FakeClock('2026-10-05')
    windowProvider = new FakeWindowProvider()
    processProvider = new FakeProcessProvider()
    idleProvider = new FakeIdleProvider()
    killer = new FakeProcessKiller()
    notifier = new FakeNotificationProvider()
    store = new InMemoryAppStore()

    store.targets = [
      {
        id: '1',
        executable: 'game.exe',
        name: 'Fun Game',
        addedAt: Date.now()
      }
    ]

    engine = new FocusEngine(
      clock,
      windowProvider,
      processProvider,
      idleProvider,
      killer,
      notifier,
      store as unknown as AppStore,
      store.config
    )
  })

  it('runs full day lifecycle: tracking -> 3 strikes -> grace -> lockout -> midnight reset', async () => {
    // 1. Initial State
    let status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('IDLE_BUDGET')
    expect(status.remainingMs).toBe(60000) // 1 min budget

    // 2. User plays the game in foreground
    windowProvider.setActiveWindow({ pid: 1234, name: 'game.exe', title: 'Fun Game' })
    processProvider.setProcesses([{ pid: 1234, name: 'game.exe' }])

    // Advance 30 seconds
    clock.advance(30000) // Note: engine clamps delta to 5000ms max per tick
    // Simulate 6 ticks of 5000ms
    for (let i = 0; i < 6; i++) {
      clock.advance(5000)
      await engine.tick()
    }

    status = engine.getStatus(null, null, false, false)
    expect(status.remainingMs).toBe(30000) // 30s remaining
    expect(status.state).toBe('IDLE_BUDGET')

    // Advance remaining 30s to hit 0
    for (let i = 0; i < 6; i++) {
      clock.advance(5000)
      await engine.tick()
    }

    // Should now be PROMPTING for strike 1
    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('PROMPTING')
    expect(status.strikeCount).toBe(0)

    // 3. User requests Strike 1: +5 minutes extension
    const ext1 = engine.requestExtension(5)
    expect(ext1.success).toBe(true)
    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('EXTENDED')
    expect(status.strikeCount).toBe(1)
    expect(status.remainingMs).toBe(300000) // 5 minutes

    // Burn through Strike 1
    for (let i = 0; i < 60; i++) {
      clock.advance(5000)
      await engine.tick()
    }
    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('PROMPTING')
    expect(status.strikeCount).toBe(1)

    // User requests Strike 2: +5 minutes
    const ext2 = engine.requestExtension(5)
    expect(ext2.success).toBe(true)
    expect(engine.getStatus(null, null, false, false).strikeCount).toBe(2)

    // Burn through Strike 2
    for (let i = 0; i < 60; i++) {
      clock.advance(5000)
      await engine.tick()
    }
    expect(engine.getStatus(null, null, false, false).state).toBe('PROMPTING')

    // User requests Strike 3 (Final Strike): +5 minutes
    const ext3 = engine.requestExtension(5)
    expect(ext3.success).toBe(true)
    expect(engine.getStatus(null, null, false, false).strikeCount).toBe(3)

    // 4. Burn through Strike 3: with strikes exhausted, hits GRACE!
    for (let i = 0; i < 60; i++) {
      clock.advance(5000)
      await engine.tick()
    }

    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('GRACE')
    expect(status.graceRemainingSec).toBe(100)
    // Should have sent 100s grace notification
    expect(notifier.notifications.some((n) => n.body.includes('100 seconds'))).toBe(true)

    // Any further extension request must be rejected
    const invalidExt = engine.requestExtension(5)
    expect(invalidExt.success).toBe(false)

    // 5. Countdown Grace period (100 seconds)
    // Advance 70 seconds to hit 30s mark
    for (let i = 0; i < 14; i++) {
      clock.advance(5000)
      await engine.tick()
    }
    expect(notifier.notifications.some((n) => n.body.includes('30 seconds'))).toBe(true)

    // Advance 20 more seconds to hit 10s mark
    for (let i = 0; i < 4; i++) {
      clock.advance(5000)
      await engine.tick()
    }
    expect(notifier.notifications.some((n) => n.body.includes('10 seconds'))).toBe(true)

    // Advance final 10s -> hits 0 -> closes targets -> LOCKED
    clock.advance(5000)
    await engine.tick()
    clock.advance(5000)
    await engine.tick()

    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('LOCKED')
    // Target PID 1234 should have been terminated
    expect(killer.killedPids.some((k) => k.pid === 1234)).toBe(true)

    // 6. User attempts to relaunch target while LOCKED
    processProvider.setProcesses([{ pid: 5678, name: 'game.exe' }])
    clock.advance(1000)
    await engine.tick()
    expect(killer.killedPids.some((k) => k.pid === 5678)).toBe(true)

    // 7. Midnight arrives (new date: 2026-10-06)
    clock.setDate('2026-10-06')
    clock.advance(1000)
    await engine.tick()

    status = engine.getStatus(null, null, false, false)
    expect(status.state).toBe('IDLE_BUDGET')
    expect(status.strikeCount).toBe(0)
    expect(status.remainingMs).toBe(60000)
    expect(status.date).toBe('2026-10-06')
  })
})
