import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/channels'
import type {
  EngineStatus,
  TargetApp,
  ProcessItem,
  AppConfig,
  DailyUsageRecord
} from '@shared/types'
import type {
  RequestExtensionInput,
  AddTargetInput,
  RemoveTargetInput,
  UpdateConfigInput
} from '@shared/ipc'

export interface FocusContractAPI {
  getEngineStatus: () => Promise<EngineStatus>
  requestExtension: (input: RequestExtensionInput) => Promise<{ success: boolean; error?: string }>
  getTargets: () => Promise<TargetApp[]>
  addTarget: (input: AddTargetInput) => Promise<TargetApp[]>
  removeTarget: (input: RemoveTargetInput) => Promise<TargetApp[]>
  getRunningProcesses: () => Promise<ProcessItem[]>
  getConfig: () => Promise<AppConfig>
  updateConfig: (input: UpdateConfigInput) => Promise<AppConfig>
  getHistory: () => Promise<DailyUsageRecord[]>
  minimizeWindow: () => void
  closeWindow: () => void
  onStateUpdated: (callback: (status: EngineStatus) => void) => () => void
}

const api: FocusContractAPI = {
  getEngineStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_ENGINE_STATUS),
  requestExtension: (input) => ipcRenderer.invoke(IPC_CHANNELS.REQUEST_EXTENSION, input),
  getTargets: () => ipcRenderer.invoke(IPC_CHANNELS.GET_TARGETS),
  addTarget: (input) => ipcRenderer.invoke(IPC_CHANNELS.ADD_TARGET, input),
  removeTarget: (input) => ipcRenderer.invoke(IPC_CHANNELS.REMOVE_TARGET, input),
  getRunningProcesses: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RUNNING_PROCESSES),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
  updateConfig: (input) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CONFIG, input),
  getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY),
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  onStateUpdated: (callback) => {
    const subscription = (_event: Electron.IpcRendererEvent, status: EngineStatus): void => {
      callback(status)
    }
    ipcRenderer.on(IPC_CHANNELS.STATE_UPDATED, subscription)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.STATE_UPDATED, subscription)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose context bridge api:', error)
  }
} else {
  const globalWin = window as unknown as { api: FocusContractAPI }
  globalWin.api = api
}
