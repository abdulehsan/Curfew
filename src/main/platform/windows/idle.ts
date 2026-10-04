import { powerMonitor } from 'electron'
import type { IdleProvider } from '../interfaces'

export class WindowsIdleProvider implements IdleProvider {
  getIdleTimeSec(): number {
    try {
      return powerMonitor.getSystemIdleTime()
    } catch {
      return 0
    }
  }
}
