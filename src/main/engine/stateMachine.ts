import {
  DEFAULT_DAILY_BUDGET_MIN,
  MAX_STRIKES,
  MAX_EXTENSION_MIN,
  GRACE_SECONDS
} from '@shared/constants'
import type {
  EngineState,
  TickInput,
  StateMachineResult,
  EngineConfig
} from './types'

export const DEFAULT_CONFIG: EngineConfig = {
  dailyBudgetMinutes: DEFAULT_DAILY_BUDGET_MIN,
  maxStrikes: MAX_STRIKES,
  maxExtensionMinutes: MAX_EXTENSION_MIN,
  graceSeconds: GRACE_SECONDS
}

export function createInitialState(
  date: string,
  dailyBudgetMinutes: number = DEFAULT_DAILY_BUDGET_MIN
): EngineState {
  return {
    state: 'IDLE_BUDGET',
    remainingMs: dailyBudgetMinutes * 60 * 1000,
    strikeCount: 0,
    graceRemainingSec: GRACE_SECONDS,
    lastResetDate: date,
    todayUsageMs: {}
  }
}

/**
 * Pure state reducer for Curfew.
 * Contains no OS or Electron imports. Fully deterministic.
 */
export function handleTick(
  state: EngineState,
  input: TickInput,
  config: EngineConfig = DEFAULT_CONFIG
): StateMachineResult {
  let currentState: EngineState = {
    ...state,
    todayUsageMs: { ...state.todayUsageMs }
  }
  const effects: StateMachineResult['effects'] = {}

  // 1. Midnight / Daily Reset Rule
  // If currentDate is strictly later than lastResetDate, reset strikes, budget, and state.
  // If currentDate is earlier than lastResetDate (clock rollback), do NOT reset.
  if (input.currentDate > currentState.lastResetDate) {
    currentState = {
      state: 'IDLE_BUDGET',
      remainingMs: config.dailyBudgetMinutes * 60 * 1000,
      strikeCount: 0,
      graceRemainingSec: config.graceSeconds,
      lastResetDate: input.currentDate,
      todayUsageMs: {}
    }
    effects.didDailyReset = true
    return {
      nextState: currentState,
      effects
    }
  }

  // 2. State-specific logic
  switch (currentState.state) {
    case 'IDLE_BUDGET':
    case 'EXTENDED': {
      // Time deduction condition: target is foreground, system not idle, session not suspended
      const shouldDeduct =
        input.isTargetForeground &&
        !input.isSystemIdle &&
        !input.isSessionSuspended &&
        input.deltaMs > 0

      if (shouldDeduct) {
        currentState.remainingMs -= input.deltaMs

        if (input.activeExecutable) {
          const key = input.activeExecutable.toLowerCase()
          currentState.todayUsageMs[key] = (currentState.todayUsageMs[key] || 0) + input.deltaMs
        }
      }

      // Check if budget has expired (remainingMs <= 0)
      if (currentState.remainingMs <= 0) {
        if (currentState.strikeCount < config.maxStrikes) {
          currentState.state = 'PROMPTING'
        } else {
          // All strikes exhausted (strikeCount === MAX_STRIKES)
          if (input.hasRunningTargets) {
            currentState.state = 'GRACE'
            currentState.graceRemainingSec = config.graceSeconds
            effects.shouldNotifyGrace = config.graceSeconds // 100s notification
          } else {
            currentState.state = 'LOCKED'
          }
        }
      }
      break
    }

    case 'PROMPTING': {
      // User is prompted with extension overlay.
      // If remainingMs <= 0 and strikes exhausted, go to GRACE or LOCKED.
      if (currentState.strikeCount >= config.maxStrikes) {
        if (input.hasRunningTargets) {
          currentState.state = 'GRACE'
          currentState.graceRemainingSec = config.graceSeconds
          effects.shouldNotifyGrace = config.graceSeconds
        } else {
          currentState.state = 'LOCKED'
        }
      }
      break
    }

    case 'GRACE': {
      // Target closed during grace: "If the user closes the target during GRACE, go straight to LOCKED."
      if (!input.hasRunningTargets) {
        currentState.state = 'LOCKED'
        break
      }

      const prevSec = currentState.graceRemainingSec
      // Deduct elapsed seconds from grace
      const elapsedSec = Math.max(1, Math.round(input.deltaMs / 1000))
      const nextSec = Math.max(0, prevSec - elapsedSec)
      currentState.graceRemainingSec = nextSec

      // Notifications at 30s and 10s
      if (prevSec > 30 && nextSec <= 30 && nextSec > 10) {
        effects.shouldNotifyGrace = 30
      } else if (prevSec > 10 && nextSec <= 10 && nextSec > 0) {
        effects.shouldNotifyGrace = 10
      }

      // Grace countdown expired
      if (nextSec <= 0) {
        currentState.state = 'LOCKED'
        effects.shouldCloseTargets = true
      }
      break
    }

    case 'LOCKED': {
      // Locked until tomorrow's reset
      if (input.hasRunningTargets) {
        effects.shouldCloseTargets = true
      }
      break
    }
  }

  return {
    nextState: currentState,
    effects
  }
}

/**
 * Handle user requesting an extension
 */
export function handleRequestExtension(
  state: EngineState,
  minutes: number,
  config: EngineConfig = DEFAULT_CONFIG
): StateMachineResult {
  // Disallow extensions in GRACE or LOCKED
  if (state.state === 'GRACE' || state.state === 'LOCKED') {
    return {
      nextState: state,
      effects: { error: 'Extensions are not allowed during Grace or Lockout.' }
    }
  }

  // Check strike limit
  if (state.strikeCount >= config.maxStrikes) {
    return {
      nextState: state,
      effects: { error: `Maximum extensions (${config.maxStrikes}) reached.` }
    }
  }

  // Validate extension duration
  if (minutes < 1 || minutes > config.maxExtensionMinutes) {
    return {
      nextState: state,
      effects: {
        error: `Extension minutes must be between 1 and ${config.maxExtensionMinutes}.`
      }
    }
  }

  const addedMs = minutes * 60 * 1000
  const nextRemaining = Math.max(0, state.remainingMs) + addedMs

  const nextState: EngineState = {
    ...state,
    strikeCount: state.strikeCount + 1,
    remainingMs: nextRemaining,
    state: 'EXTENDED'
  }

  return {
    nextState,
    effects: {}
  }
}
