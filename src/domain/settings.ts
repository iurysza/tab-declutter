import { z } from 'zod'
import { err, ok, type AppError, type Result } from './result'

export const providerKinds = ['openai', 'anthropic', 'google', 'openai-compatible'] as const
export type ProviderKind = (typeof providerKinds)[number]

const defaults: Record<Exclude<ProviderKind, 'openai-compatible'>, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
}

const rawSettingsSchema = z.object({
  provider: z.enum(providerKinds),
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
})

export interface ProviderSettings {
  readonly provider: ProviderKind
  readonly apiKey: string
  readonly model: string
  readonly baseUrl?: string
}

function validBaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol === 'https:') return true
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

export function parseProviderSettings(input: unknown): Result<ProviderSettings, AppError> {
  const parsed = rawSettingsSchema.safeParse(input)
  if (!parsed.success) return err({ code: 'not-configured', message: 'Add a provider first' })
  const apiKey = parsed.data.apiKey.trim()
  const model = parsed.data.model.trim()
  const baseUrl = parsed.data.baseUrl?.trim() || undefined
  if (!apiKey || !model) return err({ code: 'not-configured', message: 'Add an API key and model first' })
  if (parsed.data.provider === 'openai-compatible' && !baseUrl) {
    return err({ code: 'not-configured', message: 'Add a base URL for this provider' })
  }
  if (baseUrl && !validBaseUrl(baseUrl)) {
    return err({ code: 'not-configured', message: 'Use HTTPS, or HTTP on a local model' })
  }
  return ok({ provider: parsed.data.provider, apiKey, model, ...(baseUrl ? { baseUrl } : {}) })
}

export function providerBaseUrl(settings: ProviderSettings): string {
  return settings.baseUrl ?? defaults[settings.provider as Exclude<ProviderKind, 'openai-compatible'>]
}

export function providerOriginPattern(settings: ProviderSettings): string {
  const url = new URL(providerBaseUrl(settings))
  return `${url.protocol}//${url.host}/*`
}
