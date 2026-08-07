import { normaliseClassification } from '../domain/classification'
import { getCriterion } from '../domain/criteria'
import { buildClassificationPrompt } from '../domain/prompt'
import { err, ok, type AppError, type Result } from '../domain/result'
import { parseProviderSettings } from '../domain/settings'
import { createCandidates } from '../domain/tabs'
import type { AppPorts, UndoRecord } from './ports'

export interface GroupingOutcome { readonly groupCount: number; readonly tabCount: number }

export async function groupCurrentWindow(ports: AppPorts, criterionId: string): Promise<Result<GroupingOutcome, AppError>> {
  const settingsResult = parseProviderSettings(await ports.settings.loadProvider())
  if (!settingsResult.ok) return settingsResult
  const settings = settingsResult.value
  if (!(await ports.permission.contains(settings))) {
    return err({ code: 'permission-missing', message: 'Allow access to the provider in Settings' })
  }
  const criterion = getCriterion(criterionId, await ports.settings.loadCriteria())
  if (!criterion) return err({ code: 'invalid-request', message: 'Choose a grouping criterion' })
  const captured = await ports.workspace.capture()
  if (!captured.ok) return captured
  const candidates = createCandidates(captured.value.tabs)
  if (candidates.length < 2) return err({ code: 'not-enough-tabs', message: 'Open at least two unpinned tabs' })
  const classified = await ports.classifier.classify(settings, buildClassificationPrompt(criterion, candidates))
  if (!classified.ok) return classified
  const plan = normaliseClassification(candidates, classified.value)
  if (plan.groups.length === 0) return ok({ groupCount: 0, tabCount: 0 })

  const previous = await ports.undo.load()
  const previousReady = previous?.phase === 'ready' ? previous : undefined
  const pending: UndoRecord = { phase: 'pending', snapshot: captured.value, ...(previousReady ? { previous: previousReady } : {}) }
  await ports.undo.save(pending)
  const applied = await ports.workspace.apply(plan, captured.value)
  if (!applied.ok) {
    const restored = await ports.workspace.restore(captured.value)
    if (restored.ok) {
      if (previousReady) await ports.undo.save(previousReady)
      else await ports.undo.clear()
    }
    return applied
  }
  await ports.undo.save({ phase: 'ready', snapshot: captured.value })
  return ok({ groupCount: plan.groups.length, tabCount: plan.groups.reduce((total, group) => total + group.tabIds.length, 0) })
}
