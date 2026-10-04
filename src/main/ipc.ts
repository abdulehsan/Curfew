import { ipcMain, BrowserWindow } from 'electron'
import {
  IPC_CHANNELS,
  RequestExtensionSchema,
  AddTargetSchema,
  RemoveTargetSchema,
  UpdateConfigSchema
} from '@shared/ipc'
import { KNOWN_BROWSER_PROCESSES } from '@shared/constants'
import type { FocusEngine } from './engine/engine'
import type { AppStore } from './store'
import type { ProcessProvider, AutostartProvider } from './platform/interfaces'
import type { TargetApp } from '@shared/types'

export function setupIpcHandlers(
  engine: FocusEngine,
  store: AppStore,
  processProvider: ProcessProvider,
  autostartProvider: AutostartProvider
): void {
  // Engine status
  ipcMain.handle(IPC_CHANNELS.GET_ENGINE_STATUS, () => {
    return engine.getStatus(null, null, false, false)
  })

  // Request strike extension
  ipcMain.handle(IPC_CHANNELS.REQUEST_EXTENSION, (_event, rawPayload: unknown) => {
    const parseResult = RequestExtensionSchema.safeParse(rawPayload)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', ')
      }
    }

    return engine.requestExtension(parseResult.data.minutes)
  })

  // Targets
  ipcMain.handle(IPC_CHANNELS.GET_TARGETS, () => {
    return store.getTargets()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_TARGET, (_event, rawPayload: unknown) => {
    const parseResult = AddTargetSchema.safeParse(rawPayload)
    if (!parseResult.success) {
      throw new Error(parseResult.error.errors.map((e) => e.message).join(', '))
    }

    const { executable, name } = parseResult.data
    const isBrowser = KNOWN_BROWSER_PROCESSES.includes(
      executable.toLowerCase() as (typeof KNOWN_BROWSER_PROCESSES)[number]
    )

    const target: TargetApp = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      executable: executable.toLowerCase(),
      name: name || executable,
      addedAt: Date.now(),
      isBrowser
    }

    return store.addTarget(target)
  })

  ipcMain.handle(IPC_CHANNELS.REMOVE_TARGET, (_event, rawPayload: unknown) => {
    const parseResult = RemoveTargetSchema.safeParse(rawPayload)
    if (!parseResult.success) {
      throw new Error(parseResult.error.errors.map((e) => e.message).join(', '))
    }

    return store.removeTarget(parseResult.data.executable)
  })

  // Process enumeration
  ipcMain.handle(IPC_CHANNELS.GET_RUNNING_PROCESSES, async () => {
    const processes = await processProvider.getRunningProcesses()
    // Deduplicate by name and filter out empty / system idle processes
    const seen = new Set<string>()
    const filtered = processes
      .filter((p) => {
        const lower = p.name.toLowerCase()
        if (
          !lower.endsWith('.exe') ||
          lower === 'system idle process' ||
          lower === 'system' ||
          lower === 'registry' ||
          lower === 'smss.exe' ||
          lower === 'csrss.exe' ||
          lower === 'services.exe' ||
          lower === 'lsass.exe' ||
          seen.has(lower)
        ) {
          return false
        }
        seen.add(lower)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return filtered
  })

  // Config
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => {
    return store.getConfig()
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_CONFIG, (_event, rawPayload: unknown) => {
    const parseResult = UpdateConfigSchema.safeParse(rawPayload)
    if (!parseResult.success) {
      throw new Error(parseResult.error.errors.map((e) => e.message).join(', '))
    }

    const updated = store.updateConfig(parseResult.data)
    engine.updateConfig(updated)

    if (parseResult.data.autostart !== undefined) {
      autostartProvider.setEnabled(parseResult.data.autostart)
    }

    return updated
  })

  // History
  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, () => {
    return store.getHistory()
  })

  // Window Controls
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })
}
