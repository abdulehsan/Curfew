import { app, BrowserWindow, powerMonitor } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { SystemClock } from './platform/windows/clock'
import { WindowsWindowProvider } from './platform/windows/activeWindow'
import { WindowsProcessProvider } from './platform/windows/processList'
import { WindowsIdleProvider } from './platform/windows/idle'
import { WindowsProcessKiller } from './platform/windows/killer'
import { WindowsAutostartProvider } from './platform/windows/autostart'
import { WindowsNotificationProvider } from './platform/windows/notification'
import { AppStore } from './store'
import { FocusEngine } from './engine/engine'
import { setupIpcHandlers } from './ipc'
import { createWindowManager } from './windows'
import { createTrayManager } from './tray'

// 1. Single Instance Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
}

let windowManager: ReturnType<typeof createWindowManager> | null = null
let trayManager: ReturnType<typeof createTrayManager> | null = null
let engine: FocusEngine | null = null

app.on('second-instance', () => {
  // Focus existing dashboard window on second launch attempt
  windowManager?.showDashboard()
})

app.whenReady().then(async () => {
  // Set application user model id for Windows notifications
  app.setAppUserModelId('com.curfew.app')

  // Initialize store and providers
  const store = new AppStore()
  const clock = new SystemClock()
  const windowProvider = new WindowsWindowProvider()
  const processProvider = new WindowsProcessProvider()
  const idleProvider = new WindowsIdleProvider()
  const notifier = new WindowsNotificationProvider()
  const processKiller = new WindowsProcessKiller(notifier)
  const autostartProvider = new WindowsAutostartProvider()

  // Initialize engine
  const config = store.getConfig()
  engine = new FocusEngine(
    clock,
    windowProvider,
    processProvider,
    idleProvider,
    processKiller,
    notifier,
    store,
    config
  )

  // Window & Tray Management
  windowManager = createWindowManager()
  trayManager = createTrayManager(windowManager)

  // Setup IPC Handlers
  setupIpcHandlers(engine, store, processProvider, autostartProvider)

  // Check launch arguments: if '--hidden' is passed (from autostart), do not show dashboard
  const isHiddenLaunch = process.argv.includes('--hidden')
  if (!isHiddenLaunch) {
    windowManager.createDashboardWindow()
  }

  // Pre-create overlay window
  windowManager.createOverlayWindow()

  // Subscribe to Engine state changes
  engine.subscribe((status) => {
    // 1. Broadcast to all open windows
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.STATE_UPDATED, status)
      }
    })

    // 2. Control overlay visibility: show in PROMPTING or GRACE
    if (status.state === 'PROMPTING' || status.state === 'GRACE') {
      windowManager?.showOverlayInactive()
    } else {
      windowManager?.hideOverlay()
    }

    // 3. Update tray menu status
    trayManager?.updateStatus(status)
  })

  // Start engine loop
  engine.start()

  // Power monitor listeners for sleep/resume and session lock
  powerMonitor.on('suspend', () => {
    engine?.setSuspended(true)
  })

  powerMonitor.on('resume', () => {
    engine?.setSuspended(false)
  })

  powerMonitor.on('lock-screen', () => {
    engine?.setSessionLocked(true)
  })

  powerMonitor.on('unlock-screen', () => {
    engine?.setSessionLocked(false)
  })
})

app.on('before-quit', () => {
  engine?.stop()
  trayManager?.destroy()
})

app.on('window-all-closed', () => {
  // On Windows, keep running in system tray unless explicitly quit
})
