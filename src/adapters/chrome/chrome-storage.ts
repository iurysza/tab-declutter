import type { SettingsPort, UndoPort, UndoRecord } from '../../application/ports'
import { customCriterionSchema, type CustomCriterion } from '../../domain/criteria'

const keys = { provider: 'providerSettings', criteria: 'customCriteria', selected: 'selectedCriterion', undo: 'undoRecord' } as const

export const chromeSettings: SettingsPort = {
  async loadProvider() { return (await chrome.storage.local.get(keys.provider))[keys.provider] },
  async loadCriteria() {
    const value = (await chrome.storage.local.get(keys.criteria))[keys.criteria]
    if (!Array.isArray(value)) return []
    return value.flatMap((item): CustomCriterion[] => {
      const parsed = customCriterionSchema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    })
  },
  async loadSelectedCriterion() {
    const value = (await chrome.storage.local.get(keys.selected))[keys.selected]
    return typeof value === 'string' && value ? value : 'workstream'
  },
  async saveSelectedCriterion(id) { await chrome.storage.local.set({ [keys.selected]: id }) },
}

export const chromeUndo: UndoPort = {
  async load() { return (await chrome.storage.session.get(keys.undo))[keys.undo] as UndoRecord | undefined },
  async save(record) { await chrome.storage.session.set({ [keys.undo]: record }) },
  async clear() { await chrome.storage.session.remove(keys.undo) },
}

export interface OptionsData { readonly providerSettings?: unknown; readonly customCriteria: readonly CustomCriterion[] }
export async function loadOptionsData(): Promise<OptionsData> {
  return { providerSettings: await chromeSettings.loadProvider(), customCriteria: await chromeSettings.loadCriteria() }
}
export async function saveOptionsData(providerSettings: unknown, customCriteria: readonly CustomCriterion[]): Promise<void> {
  await chrome.storage.local.set({ [keys.provider]: providerSettings, [keys.criteria]: customCriteria })
}
export async function restrictLocalStorage(): Promise<void> {
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
}
