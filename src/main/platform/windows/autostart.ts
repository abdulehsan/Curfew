import { app } from 'electron'
import type { AutostartProvider } from '../interfaces'

export class WindowsAutostartProvider implements AutostartProvider {
  isEnabled(): boolean {
    try {
      const settings = app.getLoginItemSettings({
        args: ['--hidden']
      })
      return settings.openAtLogin
    } catch {
      return false
    }
  }

  setEnabled(enabled: boolean): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        args: ['--hidden']
      })
    } catch (err) {
      console.warn('[WindowsAutostartProvider] Failed to update login item settings:', err)
    }
  }
}
