import type { WindowProvider, ActiveWindowInfo } from '../interfaces'

interface ActiveWinResult {
  title?: string
  owner?: {
    processId: number
    name: string
    path?: string
  }
}

type ActiveWinFunction = () => Promise<ActiveWinResult | undefined>

export class WindowsWindowProvider implements WindowProvider {
  private activeWinFn: ActiveWinFunction | null = null

  async getActiveWindow(): Promise<ActiveWindowInfo | null> {
    try {
      if (!this.activeWinFn) {
        const mod = (await import('active-win')) as { default: ActiveWinFunction }
        this.activeWinFn = mod.default
      }
      const win = await this.activeWinFn()
      if (!win || !win.owner) {
        return null
      }
      return {
        pid: win.owner.processId,
        name: win.owner.name,
        title: win.title || ''
      }
    } catch (err) {
      console.warn('[WindowsWindowProvider] Failed to get active window:', err)
      return null
    }
  }
}
