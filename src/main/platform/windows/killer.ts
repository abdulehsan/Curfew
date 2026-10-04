import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ProcessKiller, NotificationProvider } from '../interfaces'
import { GRACE_TERMINATION_WAIT_MS } from '@shared/constants'

const execFileAsync = promisify(execFile)

export class WindowsProcessKiller implements ProcessKiller {
  constructor(private notifier?: NotificationProvider) {}

  /**
   * Attempt graceful termination using taskkill without /F (sends WM_CLOSE to top-level windows)
   */
  async closeGracefully(pid: number): Promise<boolean> {
    try {
      console.log(`[WindowsProcessKiller] Sending graceful WM_CLOSE to PID ${pid}...`)
      await execFileAsync('taskkill.exe', ['/PID', String(pid)], {
        windowsHide: true
      })
      return true
    } catch (err: unknown) {
      const execError = err as { code?: number | string; message?: string }
      console.log(
        `[WindowsProcessKiller] Graceful close PID ${pid} exited with: ${execError.code || 'unknown'}`
      )
      // Exit code 128 means process not found (already exited)
      if (execError.code === 128) {
        return true
      }
      return false
    }
  }

  /**
   * Force termination using taskkill /F /T
   */
  async forceKill(pid: number): Promise<boolean> {
    try {
      console.log(`[WindowsProcessKiller] Forcefully terminating PID ${pid} tree...`)
      await execFileAsync('taskkill.exe', ['/F', '/PID', String(pid), '/T'], {
        windowsHide: true
      })
      return true
    } catch (err: unknown) {
      const execError = err as { code?: number | string; message?: string }
      console.warn(
        `[WindowsProcessKiller] Force kill PID ${pid} failed with exit code: ${execError.code || 'unknown'}`
      )

      // Exit code 128 means process already gone
      if (execError.code === 128) {
        return true
      }

      // Exit code 1 or access denied (elevated process)
      if (execError.code === 1 || execError.code === 5) {
        this.notifier?.send(
          'Permission Required',
          `Could not close process (PID ${pid}). Please close it manually or run Curfew as administrator.`
        )
      }
      return false
    }
  }

  /**
   * Termination ladder: graceful WM_CLOSE -> wait up to 3s -> force kill
   */
  async terminateLadder(pid: number): Promise<boolean> {
    const closed = await this.closeGracefully(pid)
    if (closed) {
      return true
    }

    // Wait up to 3 seconds before escalating
    await new Promise((resolve) => setTimeout(resolve, GRACE_TERMINATION_WAIT_MS))

    return this.forceKill(pid)
  }
}
