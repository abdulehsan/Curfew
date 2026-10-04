import { Notification } from 'electron'
import type { NotificationProvider } from '../interfaces'

export class WindowsNotificationProvider implements NotificationProvider {
  send(title: string, body: string): void {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          silent: false
        })
        notification.show()
      }
    } catch (err) {
      console.warn('[WindowsNotificationProvider] Failed to show notification:', err)
    }
  }
}
