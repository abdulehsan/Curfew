import type { FocusContractAPI } from './index'

declare global {
  interface Window {
    api: FocusContractAPI
  }
}
