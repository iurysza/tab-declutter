import type { AppError, Result } from '../domain/result'
import { groupCurrentWindow, type GroupingOutcome } from './group-current-window'
import type { AppPorts } from './ports'

/** Keyboard-shortcut entry point: groups with the lens the user last picked in the popup. */
export async function groupWithSavedLens(ports: AppPorts): Promise<Result<GroupingOutcome, AppError>> {
  return groupCurrentWindow(ports, await ports.settings.loadSelectedCriterion())
}
