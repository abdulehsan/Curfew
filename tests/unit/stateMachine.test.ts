import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  handleTick,
  handleRequestExtension
} from '../../src/main/engine/stateMachine'
import type { EngineState, TickInput } from '../../src/main/engine/types'

function createDefaultTickInput(overrides: Partial<TickInput> = {}): TickInput {
  return {
    deltaMs: 1000,
    isTargetForeground: true,
    isSystemIdle: false,
    isSessionSuspended: false,
    activeExecutable: 'game.exe',
    hasRunningTargets: true,
    currentDate: '2026-10-05',
    ...overrides
  }
}

describe('Pure State Machine - handleTick', () => {
  it('deducts budget when target is foreground, not idle, not suspended', () => {
    const state = createInitialState('2026-10-05', 60)
    const initialRemaining = state.remainingMs

    const { nextState } = handleTick(state, createDefaultTickInput({ deltaMs: 1000 }))

    expect(nextState.remainingMs).toBe(initialRemaining - 1000)
    expect(nextState.todayUsageMs['game.exe']).toBe(1000)
    expect(nextState.state).toBe('IDLE_BUDGET')
  })

  it('does not deduct budget when target is NOT foreground', () => {
    const state = createInitialState('2026-10-05', 60)
    const initialRemaining = state.remainingMs

    const { nextState } = handleTick(
      state,
      createDefaultTickInput({ isTargetForeground: false, deltaMs: 1000 })
    )

    expect(nextState.remainingMs).toBe(initialRemaining)
    expect(nextState.todayUsageMs['game.exe']).toBeUndefined()
  })

  it('does not deduct budget when system is idle', () => {
    const state = createInitialState('2026-10-05', 60)
    const initialRemaining = state.remainingMs

    const { nextState } = handleTick(
      state,
      createDefaultTickInput({ isSystemIdle: true, deltaMs: 1000 })
    )

    expect(nextState.remainingMs).toBe(initialRemaining)
  })

  it('does not deduct budget when session is suspended', () => {
    const state = createInitialState('2026-10-05', 60)
    const initialRemaining = state.remainingMs

    const { nextState } = handleTick(
      state,
      createDefaultTickInput({ isSessionSuspended: true, deltaMs: 1000 })
    )

    expect(nextState.remainingMs).toBe(initialRemaining)
  })

  it('transitions to PROMPTING when budget hits <= 0 and strikes remain', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      remainingMs: 500,
      strikeCount: 0
    }

    const { nextState } = handleTick(state, createDefaultTickInput({ deltaMs: 1000 }))

    expect(nextState.remainingMs).toBe(-500)
    expect(nextState.state).toBe('PROMPTING')
  })

  it('transitions directly to GRACE when budget <= 0 and all 3 strikes are exhausted', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      remainingMs: 500,
      strikeCount: 3
    }

    const { nextState, effects } = handleTick(
      state,
      createDefaultTickInput({ deltaMs: 1000, hasRunningTargets: true })
    )

    expect(nextState.state).toBe('GRACE')
    expect(nextState.graceRemainingSec).toBe(100)
    expect(effects.shouldNotifyGrace).toBe(100)
  })

  it('transitions from PROMPTING to GRACE or LOCKED if strikes are exhausted', () => {
    const promptingGraceState: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'PROMPTING',
      remainingMs: 0,
      strikeCount: 3
    }

    const resGrace = handleTick(
      promptingGraceState,
      createDefaultTickInput({ hasRunningTargets: true })
    )
    expect(resGrace.nextState.state).toBe('GRACE')

    const resLocked = handleTick(
      promptingGraceState,
      createDefaultTickInput({ hasRunningTargets: false })
    )
    expect(resLocked.nextState.state).toBe('LOCKED')
  })

  it('transitions directly to LOCKED if strikes exhausted and NO target is running', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      remainingMs: 0,
      strikeCount: 3
    }

    const { nextState } = handleTick(
      state,
      createDefaultTickInput({ deltaMs: 1000, hasRunningTargets: false })
    )

    expect(nextState.state).toBe('LOCKED')
  })

  it('counts down grace remaining seconds and triggers notifications at 30s and 10s', () => {
    let state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'GRACE',
      graceRemainingSec: 32,
      strikeCount: 3
    }

    // Tick from 32s down to 30s
    let result = handleTick(state, createDefaultTickInput({ deltaMs: 2000 }))
    expect(result.nextState.graceRemainingSec).toBe(30)
    expect(result.effects.shouldNotifyGrace).toBe(30)

    state = {
      ...result.nextState,
      graceRemainingSec: 12
    }

    // Tick from 12s down to 10s
    result = handleTick(state, createDefaultTickInput({ deltaMs: 2000 }))
    expect(result.nextState.graceRemainingSec).toBe(10)
    expect(result.effects.shouldNotifyGrace).toBe(10)
  })

  it('transitions to LOCKED and triggers shouldCloseTargets when grace countdown reaches 0', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'GRACE',
      graceRemainingSec: 1,
      strikeCount: 3
    }

    const { nextState, effects } = handleTick(state, createDefaultTickInput({ deltaMs: 1000 }))

    expect(nextState.state).toBe('LOCKED')
    expect(nextState.graceRemainingSec).toBe(0)
    expect(effects.shouldCloseTargets).toBe(true)
  })

  it('transitions immediately to LOCKED if user closes target during GRACE', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'GRACE',
      graceRemainingSec: 80,
      strikeCount: 3
    }

    const { nextState } = handleTick(
      state,
      createDefaultTickInput({ deltaMs: 1000, hasRunningTargets: false })
    )

    expect(nextState.state).toBe('LOCKED')
  })

  it('performs daily reset when currentDate is later than lastResetDate', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-04', 60),
      state: 'LOCKED',
      strikeCount: 3,
      remainingMs: -10000,
      lastResetDate: '2026-10-04',
      todayUsageMs: { 'game.exe': 3600000 }
    }

    const { nextState, effects } = handleTick(
      state,
      createDefaultTickInput({ currentDate: '2026-10-05' })
    )

    expect(effects.didDailyReset).toBe(true)
    expect(nextState.state).toBe('IDLE_BUDGET')
    expect(nextState.remainingMs).toBe(60 * 60 * 1000)
    expect(nextState.strikeCount).toBe(0)
    expect(nextState.lastResetDate).toBe('2026-10-05')
    expect(nextState.todayUsageMs).toEqual({})
  })

  it('ignores clock rollback (system date earlier than lastResetDate)', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'LOCKED',
      strikeCount: 3,
      lastResetDate: '2026-10-05'
    }

    const { nextState, effects } = handleTick(
      state,
      createDefaultTickInput({ currentDate: '2026-10-01' })
    )

    expect(effects.didDailyReset).toBeUndefined()
    expect(nextState.state).toBe('LOCKED')
    expect(nextState.strikeCount).toBe(3)
    expect(nextState.lastResetDate).toBe('2026-10-05')
  })
})

describe('Pure State Machine - handleRequestExtension', () => {
  it('grants extension, increments strike count, and sets state to EXTENDED', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'PROMPTING',
      remainingMs: -200,
      strikeCount: 1
    }

    const { nextState, effects } = handleRequestExtension(state, 10)

    expect(effects.error).toBeUndefined()
    expect(nextState.strikeCount).toBe(2)
    expect(nextState.state).toBe('EXTENDED')
    expect(nextState.remainingMs).toBe(10 * 60 * 1000) // added from 0 base
  })

  it('rejects extension when max strikes (3) have already been reached', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'PROMPTING',
      strikeCount: 3
    }

    const { nextState, effects } = handleRequestExtension(state, 10)

    expect(effects.error).toContain('Maximum extensions')
    expect(nextState.strikeCount).toBe(3)
  })

  it('rejects extension with invalid minute duration (< 1 or > 10)', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'PROMPTING',
      strikeCount: 0
    }

    const resultLow = handleRequestExtension(state, 0)
    expect(resultLow.effects.error).toBeDefined()

    const resultHigh = handleRequestExtension(state, 11)
    expect(resultHigh.effects.error).toBeDefined()
  })

  it('counts down 100s in PROMPTING and locks with target closure if ignored', () => {
    const state: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'PROMPTING',
      remainingMs: 0,
      graceRemainingSec: 100,
      strikeCount: 1
    }

    // 50s tick
    let res = handleTick(state, createDefaultTickInput({ deltaMs: 50000, hasRunningTargets: true }))
    expect(res.nextState.state).toBe('PROMPTING')
    expect(res.nextState.graceRemainingSec).toBe(50)

    // another 50s tick -> reaches 0s
    res = handleTick(res.nextState, createDefaultTickInput({ deltaMs: 50000, hasRunningTargets: true }))
    expect(res.nextState.state).toBe('LOCKED')
    expect(res.effects.shouldCloseTargets).toBe(true)
  })

  it('rejects extension when in GRACE or LOCKED state', () => {
    const graceState: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'GRACE',
      strikeCount: 3
    }
    const lockedState: EngineState = {
      ...createInitialState('2026-10-05', 60),
      state: 'LOCKED',
      strikeCount: 3
    }

    expect(handleRequestExtension(graceState, 10).effects.error).toBeDefined()
    expect(handleRequestExtension(lockedState, 10).effects.error).toBeDefined()
  })
})
