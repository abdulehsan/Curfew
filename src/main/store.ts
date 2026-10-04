import Store from 'electron-store'
import type { AppStoreData, TargetApp, AppConfig, TodayState, DailyUsageRecord } from '@shared/types'
import {
  DEFAULT_DAILY_BUDGET_MIN,
  IDLE_THRESHOLD_SEC,
  GRACE_SECONDS,
  MAX_HISTORY_DAYS
} from '@shared/constants'

const CURRENT_SCHEMA_VERSION = 1

export function getDefaultConfig(): AppConfig {
  return {
    dailyBudgetMinutes: DEFAULT_DAILY_BUDGET_MIN,
    idleThresholdSeconds: IDLE_THRESHOLD_SEC,
    autostart: true
  }
}

export function getDefaultTodayState(todayDate: string): TodayState {
  return {
    date: todayDate,
    remainingMs: DEFAULT_DAILY_BUDGET_MIN * 60 * 1000,
    strikeCount: 0,
    state: 'IDLE_BUDGET',
    graceRemainingSec: GRACE_SECONDS,
    lastTickTime: Date.now()
  }
}

export class AppStore {
  private store: Store<AppStoreData>

  constructor(customStore?: Store<AppStoreData>) {
    if (customStore) {
      this.store = customStore
      return
    }

    const todayDate = new Date().toISOString().split('T')[0]

    this.store = new Store<AppStoreData>({
      name: 'focuscontract-config',
      defaults: {
        version: CURRENT_SCHEMA_VERSION,
        config: getDefaultConfig(),
        targets: [],
        today: getDefaultTodayState(todayDate),
        history: []
      },
      migrations: {
        // Example migration for future schema version upgrades
        '1.0.0': (store) => {
          store.set('version', 1)
        }
      }
    })
  }

  getConfig(): AppConfig {
    return this.store.get('config', getDefaultConfig())
  }

  updateConfig(partial: Partial<AppConfig>): AppConfig {
    const current = this.getConfig()
    const updated = { ...current, ...partial }
    this.store.set('config', updated)
    return updated
  }

  getTargets(): TargetApp[] {
    return this.store.get('targets', [])
  }

  setTargets(targets: TargetApp[]): void {
    this.store.set('targets', targets)
  }

  addTarget(target: TargetApp): TargetApp[] {
    const targets = this.getTargets()
    const exists = targets.some(
      (t) => t.executable.toLowerCase() === target.executable.toLowerCase()
    )
    if (!exists) {
      targets.push(target)
      this.setTargets(targets)
    }
    return targets
  }

  removeTarget(executable: string): TargetApp[] {
    const targets = this.getTargets().filter(
      (t) => t.executable.toLowerCase() !== executable.toLowerCase()
    )
    this.setTargets(targets)
    return targets
  }

  getTodayState(): TodayState {
    const todayDate = new Date().toISOString().split('T')[0]
    return this.store.get('today', getDefaultTodayState(todayDate))
  }

  saveTodayState(today: TodayState): void {
    this.store.set('today', today)
  }

  getHistory(): DailyUsageRecord[] {
    return this.store.get('history', [])
  }

  recordDailyUsage(record: DailyUsageRecord): void {
    const history = this.getHistory()
    const existingIndex = history.findIndex((h) => h.date === record.date)
    if (existingIndex >= 0) {
      history[existingIndex] = record
    } else {
      history.push(record)
    }

    // Keep history capped at MAX_HISTORY_DAYS
    if (history.length > MAX_HISTORY_DAYS) {
      history.splice(0, history.length - MAX_HISTORY_DAYS)
    }

    this.store.set('history', history)
  }
}
