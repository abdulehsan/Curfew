import { z } from 'zod'
import { MAX_EXTENSION_MIN, MIN_EXTENSION_MIN } from './constants'
export { IPC_CHANNELS } from './channels'

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
