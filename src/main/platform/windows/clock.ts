import type { Clock } from '../interfaces'

export class SystemClock implements Clock {
  now(): number {
    return Date.now()
  }

  today(): string {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
