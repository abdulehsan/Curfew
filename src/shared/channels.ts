export const IPC_CHANNELS = {
  // Engine & State
  GET_ENGINE_STATUS: 'engine:get-status',
  REQUEST_EXTENSION: 'engine:request-extension',

  // Targets
  GET_TARGETS: 'targets:get',
  ADD_TARGET: 'targets:add',
  REMOVE_TARGET: 'targets:remove',
  GET_RUNNING_PROCESSES: 'process:get-running',

  // Config & History
  GET_CONFIG: 'config:get',
  UPDATE_CONFIG: 'config:update',
  GET_HISTORY: 'history:get',

  // Window Controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',

  // Push notifications from main to renderer
  STATE_UPDATED: 'events:state-updated'
} as const
