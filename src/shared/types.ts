export type ContractState = 'IDLE_BUDGET' | 'PROMPTING' | 'EXTENDED' | 'GRACE' | 'LOCKED'

export interface TargetApp {
  id: string
  executable: string
  name: string
  addedAt: number
  isBrowser?: boolean
}

export interface ProcessItem {
  pid: number
  name: string
  windowTitle?: string
}

export interface AppConfig {
  dailyBudgetMinutes: number
  idleThresholdSeconds: number
  autostart: boolean
}

export interface TodayState {
  date: string
  remainingMs: number
  strikeCount: number
  state: ContractState
  graceRemainingSec: number
  lastTickTime: number
}

export interface DailyUsageRecord {
  date: string
  appUsageMs: Record<string, number>
  totalUsageMs: number
}

export interface AppStoreData {
  version: number
  config: AppConfig
  targets: TargetApp[]
  today: TodayState
  history: DailyUsageRecord[]
}

export interface EngineStatus {
  state: ContractState
  remainingMs: number
  strikeCount: number
  maxStrikes: number
  graceRemainingSec: number
  activeTarget: TargetApp | null
  activeProcess: ProcessItem | null
  isTrackingActive: boolean
  isSystemIdle: boolean
  todayUsageMs: Record<string, number>
  totalTodayUsageMs: number
  date: string
}
