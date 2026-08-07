import { getPopupState } from '../application/get-popup-state'
import { groupCurrentWindow } from '../application/group-current-window'
import type { AppPorts } from '../application/ports'
import { requestSchema, type RuntimeResponse } from '../application/runtime-messages'
import { undoLastGrouping } from '../application/undo-last-grouping'

export function createDispatch(ports: AppPorts) {
  return async (input: unknown): Promise<RuntimeResponse> => {
    const parsed = requestSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: { code: 'invalid-request', message: 'Threadline received an invalid request' } }
    const request = parsed.data
    if (request.type === 'get-popup-state') return { ok: true, data: await getPopupState(ports) }
    if (request.type === 'select-criterion') {
      await ports.settings.saveSelectedCriterion(request.criterionId)
      return { ok: true }
    }
    const result = request.type === 'group-tabs'
      ? await groupCurrentWindow(ports, request.criterionId)
      : await undoLastGrouping(ports)
    return result.ok ? { ok: true, data: result.value } : { ok: false, error: result.error }
  }
}
