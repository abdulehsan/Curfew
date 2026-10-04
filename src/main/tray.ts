import { Tray, Menu, nativeImage, app } from 'electron'
import type { WindowManager } from './windows'
import type { EngineStatus } from '@shared/types'

export function createTrayManager(windowManager: WindowManager): {
  tray: Tray
  updateStatus: (status: EngineStatus) => void
  destroy: () => void
} {
  // Create a 16x16 icon in memory (transparent with a target dot)
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifYdQAGg3A' +
        '0cEYq5m4FEHMQZeDqWUgWQNMM3IugJnFaSAuDWi2Y5jBCiQvEKOaQY00AM1yYkwi+AOUGsFh' +
        'G3pQEIqI9gUe2yA0mP2ALgbj9w9u3QxYegUAVU1k0/7Ue4AAAAAASUVORK5CYII=',
      'base64'
    )
  )

  const tray = new Tray(icon)
  tray.setToolTip('Curfew - Self Accountability')

  let currentStatus: EngineStatus | null = null

  const updateMenu = (): void => {
    const isLockedOrGrace =
      currentStatus?.state === 'GRACE' || currentStatus?.state === 'LOCKED'

    const minutesLeft = currentStatus
      ? Math.max(0, Math.ceil(currentStatus.remainingMs / 60000))
      : 0

    const strikesUsed = currentStatus ? currentStatus.strikeCount : 0

    const statusLabel = currentStatus
      ? `Status: ${currentStatus.state} | ${minutesLeft}m left | Strikes: ${strikesUsed}/3`
      : 'Status: Initializing...'

    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Open Dashboard',
        click: (): void => {
          windowManager.showDashboard()
        }
      },
      {
        label: statusLabel,
        enabled: false
      },
      {
        type: 'separator'
      }
    ]

    // While in GRACE or LOCKED, hide the Quit item as per 5.6
    if (!isLockedOrGrace) {
      menuTemplate.push({
        label: 'Quit Curfew',
        click: (): void => {
          app.quit()
        }
      })
    }

    const contextMenu = Menu.buildFromTemplate(menuTemplate)
    tray.setContextMenu(contextMenu)
  }

  tray.on('double-click', () => {
    windowManager.showDashboard()
  })

  updateMenu()

  return {
    tray,
    updateStatus: (status: EngineStatus): void => {
      currentStatus = status
      updateMenu()
    },
    destroy: (): void => {
      tray.destroy()
    }
  }
}
