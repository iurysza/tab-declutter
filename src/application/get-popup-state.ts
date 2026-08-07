import { builtInCriteria } from '../domain/criteria'
import { parseProviderSettings } from '../domain/settings'
import type { AppPorts } from './ports'

export async function getPopupState(ports: AppPorts) {
  const custom = await ports.settings.loadCriteria()
  return {
    configured: parseProviderSettings(await ports.settings.loadProvider()).ok,
    criteria: [...builtInCriteria, ...custom.map((item) => ({ ...item, description: 'Your custom grouping instruction' }))],
    selectedCriterion: await ports.settings.loadSelectedCriterion(),
    canUndo: (await ports.undo.load()) !== undefined,
  }
}
