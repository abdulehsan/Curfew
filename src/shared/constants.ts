export const DEFAULT_DAILY_BUDGET_MIN = 60
export const MAX_STRIKES = 3
export const MAX_EXTENSION_MIN = 10
export const MIN_EXTENSION_MIN = 1
export const GRACE_SECONDS = 100
export const IDLE_THRESHOLD_SEC = 120

export const TICK_INTERVAL_MS = 1000
export const MAX_TICK_DELTA_MS = 5000
export const PERSIST_INTERVAL_MS = 10000

export const GRACE_NOTIFICATION_SECONDS = [100, 30, 10] as const
export const GRACE_TERMINATION_WAIT_MS = 3000
export const LOCK_RETRY_BACKOFF_MS = 5000
export const MAX_HISTORY_DAYS = 30

export const KNOWN_BROWSER_PROCESSES = [
  'chrome.exe',
  'msedge.exe',
  'firefox.exe',
  'brave.exe',
  'opera.exe',
  'vivaldi.exe'
] as const
