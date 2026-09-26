import { builtInCriteria, defaultCriterionId } from '../domain/criteria'
import { parseProviderSettings } from '../domain/settings'
import { isEligibleTab } from '../domain/tabs'
import type { AppPorts } from './ports'

export interface CriterionView {
  readonly id: string
  readonly name: string
  readonly description: string
}

export interface PopupState {
  readonly configured: boolean
  readonly criteria: readonly CriterionView[]
  readonly selectedCriterion: string
  readonly canUndo: boolean
  /** Tabs that grouping would consider, or undefined when the window cannot be read. */
  readonly eligibleTabCount?: number
}

export async function getPopupState(ports: AppPorts): Promise<PopupState> {
  const custom = await ports.settings.loadCriteria()
  const criteria: CriterionView[] = [
    ...builtInCriteria.map(({ id, name, description }) => ({ id, name, description })),
    ...custom.map(({ id, name, instruction }) => ({ id, name, description: instruction })),
  ]
  const storedSelection = await ports.settings.loadSelectedCriterion()
  const selectedCriterion = criteria.some((item) => item.id === storedSelection) ? storedSelection : defaultCriterionId
  if (selectedCriterion !== storedSelection) await ports.settings.saveSelectedCriterion(selectedCriterion)
  const captured = await ports.workspace.capture()
  return {
    configured: parseProviderSettings(await ports.settings.loadProvider()).ok,
    criteria,
    selectedCriterion,
    canUndo: (await ports.undo.load()) !== undefined,
    ...(captured.ok ? { eligibleTabCount: captured.value.tabs.filter(isEligibleTab).length } : {}),
  }
}
