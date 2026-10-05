import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { WindowProvider, ActiveWindowInfo } from '../interfaces'

const execFileAsync = promisify(execFile)

interface ActiveWinResult {
  title?: string
  owner?: {
    processId: number
    name: string
    path?: string
  }
}

type ActiveWinFunction = () => Promise<ActiveWinResult | undefined>

function getForegroundBinaryPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'resources', 'get-foreground.exe'),
    path.join(__dirname, '..', '..', '..', 'resources', 'get-foreground.exe'),
    path.join(__dirname, '..', '..', 'resources', 'get-foreground.exe'),
    typeof process.resourcesPath === 'string'
      ? path.join(process.resourcesPath, 'resources', 'get-foreground.exe')
      : null,
    typeof process.resourcesPath === 'string'
      ? path.join(process.resourcesPath, 'get-foreground.exe')
      : null
  ]

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

export class WindowsWindowProvider implements WindowProvider {
  private activeWinFn: ActiveWinFunction | null = null

  async getActiveWindow(): Promise<ActiveWindowInfo | null> {
    // 1. Try active-win first
    try {
      if (!this.activeWinFn) {
        const mod = (await import('active-win')) as { default: ActiveWinFunction }
        this.activeWinFn = mod.default
      }
      const win = await this.activeWinFn()
      if (win && win.owner && win.owner.processId > 0) {
        const rawPath = win.owner.path || ''
        const exeFromPath = rawPath ? path.basename(rawPath) : ''
        const name = exeFromPath || win.owner.name || ''
        return {
          pid: win.owner.processId,
          name,
          title: win.title || '',
          path: rawPath
        }
      }
    } catch {
      // active-win may fail or be blocked by anti-cheat (e.g. Riot Vanguard)
    }

    // 2. Native user32 GetForegroundWindow fallback (Anti-Cheat & Fullscreen Safe)
    try {
      const binPath = getForegroundBinaryPath()
      if (binPath) {
        const { stdout } = await execFileAsync(binPath, [], {
          windowsHide: true,
          timeout: 1000
        })
        const parsed = JSON.parse(stdout.trim()) as { pid: number; title: string }
        if (parsed.pid > 0) {
          return {
            pid: parsed.pid,
            name: '', // Will be resolved by PID via tasklist.exe in engine.ts
            title: parsed.title || ''
          }
        }
      }
    } catch {
      // Fallback binary execution failed or timed out
    }

    return null
  }
}
