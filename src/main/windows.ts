import { BrowserWindow, screen, app } from 'electron'
import { join } from 'path'

export interface WindowManager {
  dashboardWindow: BrowserWindow | null
  overlayWindow: BrowserWindow | null
  createDashboardWindow: () => BrowserWindow
  createOverlayWindow: () => BrowserWindow
  showDashboard: () => void
  showOverlayInactive: () => void
  hideOverlay: () => void
}

export function createWindowManager(): WindowManager {
  let dashboardWindow: BrowserWindow | null = null
  let overlayWindow: BrowserWindow | null = null

  const createDashboardWindow = (): BrowserWindow => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.show()
      dashboardWindow.focus()
      return dashboardWindow
    }

    dashboardWindow = new BrowserWindow({
      width: 960,
      height: 700,
      minWidth: 840,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      title: 'FocusContract',
      backgroundColor: '#0f172a',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    dashboardWindow.on('ready-to-show', () => {
      dashboardWindow?.show()
    })

    dashboardWindow.on('close', (event) => {
      // Hide to tray instead of quitting
      event.preventDefault()
      dashboardWindow?.hide()
    })

    // Load react renderer
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      dashboardWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      dashboardWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return dashboardWindow
  }

  const createOverlayWindow = (): BrowserWindow => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      return overlayWindow
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize

    const overlayWidth = 460
    const overlayHeight = 220
    const x = Math.round(screenWidth - overlayWidth - 30)
    const y = 40

    overlayWindow = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    overlayWindow.setAlwaysOnTop(true, 'screen-saver')

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      overlayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#overlay`)
    } else {
      overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'overlay'
      })
    }

    return overlayWindow
  }

  const showDashboard = (): void => {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) {
      createDashboardWindow()
    } else {
      dashboardWindow.show()
      dashboardWindow.focus()
    }
  }

  const showOverlayInactive = (): void => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      overlayWindow = createOverlayWindow()
    }
    // Show without stealing focus from full screen games
    overlayWindow.showInactive()
  }

  const hideOverlay = (): void => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide()
    }
  }

  return {
    get dashboardWindow() {
      return dashboardWindow
    },
    get overlayWindow() {
      return overlayWindow
    },
    createDashboardWindow,
    createOverlayWindow,
    showDashboard,
    showOverlayInactive,
    hideOverlay
  }
}
