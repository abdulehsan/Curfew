import { describe, it, expect, beforeEach } from 'vitest'
import { AppStore, getDefaultConfig, getDefaultTodayState } from '../../src/main/store'
import type { TargetApp, DailyUsageRecord } from '@shared/types'

// Mock Electron Store in-memory for testing
class MockElectronStore {
  private data: Record<string, unknown> = {}

  constructor(options?: { defaults?: Record<string, unknown> }) {
    if (options?.defaults) {
      this.data = JSON.parse(JSON.stringify(options.defaults))
    }
  }

  get(key: string, defaultValue?: unknown): unknown {
    return this.data[key] !== undefined ? this.data[key] : defaultValue
  }

  set(key: string, value: unknown): void {
    this.data[key] = JSON.parse(JSON.stringify(value))
  }
}

describe('AppStore', () => {
  let mockStore: MockElectronStore
  let appStore: AppStore

  beforeEach(() => {
    mockStore = new MockElectronStore({
      defaults: {
        version: 1,
        config: getDefaultConfig(),
        targets: [],
        today: getDefaultTodayState('2026-10-05'),
        history: []
      }
    })
    // @ts-expect-error injecting mock store
    appStore = new AppStore(mockStore)
  })

  it('loads default config and supports partial updates', () => {
    const config = appStore.getConfig()
    expect(config.dailyBudgetMinutes).toBe(60)
    expect(config.autostart).toBe(true)

    const updated = appStore.updateConfig({ dailyBudgetMinutes: 90 })
    expect(updated.dailyBudgetMinutes).toBe(90)
    expect(appStore.getConfig().dailyBudgetMinutes).toBe(90)
  })

  it('adds and removes targets without duplicates (case-insensitive)', () => {
    const target1: TargetApp = {
      id: '1',
      executable: 'steam.exe',
      name: 'Steam',
      addedAt: Date.now()
    }

    appStore.addTarget(target1)
    expect(appStore.getTargets()).toHaveLength(1)

    // Adding duplicate (different case) should be ignored
    const targetDup: TargetApp = {
      id: '2',
      executable: 'STEAM.EXE',
      name: 'Steam Uppercase',
      addedAt: Date.now()
    }
    appStore.addTarget(targetDup)
    expect(appStore.getTargets()).toHaveLength(1)

    // Remove target
    appStore.removeTarget('Steam.exe')
    expect(appStore.getTargets()).toHaveLength(0)
  })

  it('records daily usage and caps history at 30 days', () => {
    for (let i = 1; i <= 35; i++) {
      const dayStr = String(i).padStart(2, '0')
      const record: DailyUsageRecord = {
        date: `2026-09-${dayStr}`,
        appUsageMs: { 'game.exe': 1000 * i },
        totalUsageMs: 1000 * i
      }
      appStore.recordDailyUsage(record)
    }

    const history = appStore.getHistory()
    expect(history.length).toBe(30)
    // Oldest 5 entries should have been trimmed
    expect(history[0].date).toBe('2026-09-06')
  })
})
