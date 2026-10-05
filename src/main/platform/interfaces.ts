export interface ProcessInfo {
  pid: number
  name: string
  windowTitle?: string
}

export interface ActiveWindowInfo {
  pid: number
  name: string
  title: string
  path?: string
}

export interface Clock {
  now(): number
  today(): string // local YYYY-MM-DD
}

export interface ProcessProvider {
  getRunningProcesses(): Promise<ProcessInfo[]>
}

export interface WindowProvider {
  getActiveWindow(): Promise<ActiveWindowInfo | null>
}

export interface IdleProvider {
  getIdleTimeSec(): number
}

export interface ProcessKiller {
  closeGracefully(pid: number): Promise<boolean>
  forceKill(pid: number): Promise<boolean>
}

export interface AutostartProvider {
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
}

export interface NotificationProvider {
  send(title: string, body: string): void
}
