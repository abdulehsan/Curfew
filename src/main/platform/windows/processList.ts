import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ProcessInfo, ProcessProvider } from '../interfaces'

const execFileAsync = promisify(execFile)

export class WindowsProcessProvider implements ProcessProvider {
  async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      // Execute tasklist using array arguments (prevents shell injection)
      const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      })

      const processes: ProcessInfo[] = []
      const lines = stdout.split(/\r?\n/)

      for (const line of lines) {
        if (!line.trim()) continue

        // CSV line format: "Image Name","PID","Session Name","Session#","Mem Usage"
        // Parse CSV fields handling quoted strings
        const matches = line.match(/^"([^"]+)","([^"]+)"/)
        if (matches && matches[1] && matches[2]) {
          const name = matches[1].trim()
          const pid = parseInt(matches[2], 10)
          if (!isNaN(pid) && pid > 0) {
            processes.push({
              pid,
              name
            })
          }
        }
      }

      return processes
    } catch (err) {
      console.warn('[WindowsProcessProvider] Error listing processes:', err)
      return []
    }
  }
}
