import { expect, it, vi } from 'vitest'
import { createDispatch } from './dispatch'
import type { AppPorts } from '../application/ports'
import { ok } from '../domain/result'

const ports: AppPorts = {
  workspace: { capture: vi.fn(async () => ok({ windowId: 1, tabs: [], groups: [] })), apply: vi.fn(async () => ok(undefined)), restore: vi.fn(async () => ok(undefined)) },
  settings: { loadProvider: vi.fn(async () => undefined), loadCriteria: vi.fn(async () => []), loadSelectedCriterion: vi.fn(async () => 'workstream'), saveSelectedCriterion: vi.fn(async () => {}) },
  undo: { load: vi.fn(async () => undefined), save: vi.fn(async () => {}), clear: vi.fn(async () => {}) },
  permission: { contains: vi.fn(async () => true) },
  classifier: { classify: vi.fn(async () => ok({ groups: [] })) },
}

it('rejects malformed messages and never serialises provider settings', async () => {
  const dispatch = createDispatch(ports)
  expect(await dispatch({ type: 'group-tabs', criterionId: '' })).toEqual({ ok: false, error: { code: 'invalid-request', message: 'Tab Declutter received an invalid request' } })
  const state = JSON.stringify(await dispatch({ type: 'get-popup-state' }))
  expect(state).not.toContain('apiKey')
})
