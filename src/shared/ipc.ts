import { z } from 'zod'
import { MAX_EXTENSION_MIN, MIN_EXTENSION_MIN } from './constants'

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

// Zod schemas for validation
export const RequestExtensionSchema = z.object({
  minutes: z
    .number()
    .int()
    .min(MIN_EXTENSION_MIN, `Extension must be at least ${MIN_EXTENSION_MIN} minute`)
    .max(MAX_EXTENSION_MIN, `Extension cannot exceed ${MAX_EXTENSION_MIN} minutes`)
})

export const AddTargetSchema = z.object({
  executable: z
    .string()
    .min(1)
    .max(255)
    .regex(/\.exe$/i, 'Executable name must end in .exe')
    .transform((val) => val.trim().toLowerCase()),
  name: z.string().max(100).optional()
})

export const RemoveTargetSchema = z.object({
  executable: z
    .string()
    .min(1)
    .transform((val) => val.trim().toLowerCase())
})

export const UpdateConfigSchema = z.object({
  dailyBudgetMinutes: z.number().int().min(1).max(1440).optional(),
  idleThresholdSeconds: z.number().int().min(10).max(3600).optional(),
  autostart: z.boolean().optional()
})

export type RequestExtensionInput = z.infer<typeof RequestExtensionSchema>
export type AddTargetInput = z.infer<typeof AddTargetSchema>
export type RemoveTargetInput = z.infer<typeof RemoveTargetSchema>
export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>
