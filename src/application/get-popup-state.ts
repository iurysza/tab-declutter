import { builtInCriteria } from '../domain/criteria'
import { parseProviderSettings } from '../domain/settings'
import type { AppPorts } from './ports'

export async function getPopupState(ports: AppPorts) {
  const custom = await ports.settings.loadCriteria()
  const criteria = [...builtInCriteria, ...custom.map((item) => ({ ...item, description: 'Your custom grouping instruction' }))]
  const storedSelection = await ports.settings.loadSelectedCriterion()
  const selectedCriterion = criteria.some((item) => item.id === storedSelection) ? storedSelection : 'workstream'
  if (selectedCriterion !== storedSelection) await ports.settings.saveSelectedCriterion(selectedCriterion)
  return {
    configured: parseProviderSettings(await ports.settings.loadProvider()).ok,
    criteria,
    selectedCriterion,
    canUndo: (await ports.undo.load()) !== undefined,
  }
}
