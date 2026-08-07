import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { ProviderSettings } from '../../domain/settings'

export function createModel(settings: ProviderSettings) {
  const common = { apiKey: settings.apiKey, ...(settings.baseUrl ? { baseURL: settings.baseUrl } : {}) }
  switch (settings.provider) {
    case 'openai': return createOpenAI(common)(settings.model)
    case 'anthropic': return createAnthropic(common)(settings.model)
    case 'google': return createGoogleGenerativeAI(common)(settings.model)
    case 'openai-compatible': return createOpenAICompatible({ name: 'custom', apiKey: settings.apiKey, baseURL: settings.baseUrl! })(settings.model)
  }
}
