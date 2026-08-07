import type { ModelClassification, GroupingPlan } from '../domain/classification'
import type { CustomCriterion } from '../domain/criteria'
import type { AppError, Result } from '../domain/result'
import type { ProviderSettings } from '../domain/settings'
import type { WindowSnapshot } from '../domain/tabs'
import type { ClassificationPrompt } from '../domain/prompt'

export type UndoRecord =
  | { readonly phase: 'ready'; readonly snapshot: WindowSnapshot }
  | { readonly phase: 'pending'; readonly snapshot: WindowSnapshot; readonly previous?: { readonly phase: 'ready'; readonly snapshot: WindowSnapshot } }

export interface WorkspacePort {
  capture(): Promise<Result<WindowSnapshot, AppError>>
  apply(plan: GroupingPlan, snapshot: WindowSnapshot): Promise<Result<void, AppError>>
  restore(snapshot: WindowSnapshot): Promise<Result<void, AppError>>
}
export interface SettingsPort {
  loadProvider(): Promise<unknown>
  loadCriteria(): Promise<readonly CustomCriterion[]>
  loadSelectedCriterion(): Promise<string>
  saveSelectedCriterion(id: string): Promise<void>
}
export interface UndoPort {
  load(): Promise<UndoRecord | undefined>
  save(record: UndoRecord): Promise<void>
  clear(): Promise<void>
}
export interface PermissionPort { contains(settings: ProviderSettings): Promise<boolean> }
export interface ClassifierPort {
  classify(settings: ProviderSettings, prompt: ClassificationPrompt): Promise<Result<ModelClassification, AppError>>
}
export interface AppPorts {
  readonly workspace: WorkspacePort
  readonly settings: SettingsPort
  readonly undo: UndoPort
  readonly permission: PermissionPort
  readonly classifier: ClassifierPort
}
