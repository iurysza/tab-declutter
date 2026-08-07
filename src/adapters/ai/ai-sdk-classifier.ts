import { generateText, Output } from 'ai'
import type { ClassifierPort } from '../../application/ports'
import { classificationSchema } from '../../domain/classification'
import type { AppError } from '../../domain/result'
import { err, ok } from '../../domain/result'
import { createModel } from './create-model'

function safeProviderError(error: unknown): AppError {
  const status = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : undefined
  if (status === 401 || status === 403) return { code: 'provider-auth', message: 'Check the provider API key' }
  if (status === 429) return { code: 'provider-rate-limit', message: 'The provider is busy. Try again shortly' }
  if (status !== undefined) return { code: 'provider-unreachable', message: 'The provider could not complete the request' }
  if (error instanceof TypeError) return { code: 'provider-unreachable', message: 'Could not reach the provider' }
  return { code: 'invalid-response', message: 'The model did not return usable groups' }
}

export const aiSdkClassifier: ClassifierPort = {
  async classify(settings, prompt) {
    try {
      const result = await generateText({
        model: createModel(settings),
        output: Output.object({ name: 'TabGroups', description: 'Useful groups of related browser tab references', schema: classificationSchema }),
        system: prompt.system,
        prompt: prompt.prompt,
      })
      return ok(result.output)
    } catch (error) {
      return err(safeProviderError(error))
    }
  },
}

export { safeProviderError }
