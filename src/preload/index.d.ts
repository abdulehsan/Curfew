import type { CurfewAPI } from './index'

declare global {
  interface Window {
    api: CurfewAPI
  }
}
