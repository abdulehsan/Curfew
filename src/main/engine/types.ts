import type { ContractState } from '@shared/types'

export interface EngineState {
  state: ContractState
  remainingMs: number
  strikeCount: number
  graceRemainingSec: number
  lastResetDate: string
  todayUsageMs: Record<string, number>
}

export interface TickInput {
  deltaMs: number
  isTargetForeground: boolean
  isSystemIdle: boolean
  isSessionSuspended: boolean
  activeExecutable: string | null
  hasRunningTargets: boolean
  currentDate: string // YYYY-MM-DD
}

export interface StateMachineEffects {
  shouldNotifyGrace?: number // seconds remaining to notify: 100, 30, 10
  shouldCloseTargets?: boolean
  didDailyReset?: boolean
  error?: string
}

export interface StateMachineResult {
  nextState: EngineState
  effects: StateMachineEffects
}

export interface EngineConfig {
  dailyBudgetMinutes: number
  maxStrikes: number
  maxExtensionMinutes: number
  graceSeconds: number
}
