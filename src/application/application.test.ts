import { describe, expect, it, vi } from 'vitest'
import { groupCurrentWindow } from './group-current-window'
import { undoLastGrouping } from './undo-last-grouping'
import { groupWithSavedLens } from './group-with-saved-lens'
import { getPopupState } from './get-popup-state'
import type { AppPorts, UndoRecord } from './ports'
import type { WindowSnapshot } from '../domain/tabs'
import { err, ok } from '../domain/result'

const snapshot: WindowSnapshot = { windowId: 1, groups: [], tabs: [
  { id: 1, windowId: 1, index: 0, title: 'Issue', url: 'https://example.com/1', pinned: false, groupId: -1 },
  { id: 2, windowId: 1, index: 1, title: 'Code', url: 'https://example.com/2', pinned: false, groupId: -1 },
] }

function makePorts(overrides: Partial<AppPorts> = {}): AppPorts & { undoValue?: UndoRecord } {
  const state: AppPorts & { undoValue?: UndoRecord } = {
    workspace: { capture: vi.fn(async () => ok(snapshot)), apply: vi.fn(async () => ok(undefined)), restore: vi.fn(async () => ok(undefined)) },
    settings: { loadProvider: vi.fn(async () => ({ provider: 'openai', apiKey: 'test-key', model: 'test-model' })), loadCriteria: vi.fn(async () => []), loadSelectedCriterion: vi.fn(async () => 'project'), saveSelectedCriterion: vi.fn(async () => {}) },
    permission: { contains: vi.fn(async () => true) },
    clock: { now: () => 0 },
    classifier: { classify: vi.fn(async () => ok({ groups: [{ name: 'Ship feature', tabs: ['T1', 'T2'] }] })) },
    undo: {
      load: vi.fn(async () => state.undoValue),
      save: vi.fn(async (record) => { state.undoValue = record }),
      clear: vi.fn(async () => { state.undoValue = undefined }),
    },
    ...overrides,
  }
  return state
}

describe('application orchestration', () => {
  it('classifies before mutation, saves pending, then exposes undo', async () => {
    const ports = makePorts()
    expect(await groupCurrentWindow(ports, 'project')).toEqual(ok({ groupCount: 1, tabCount: 2 }))
    expect(ports.undoValue).toEqual({ phase: 'ready', snapshot })
    expect(ports.workspace.apply).toHaveBeenCalledOnce()
  })

  it('does not mutate for invalid settings, permission, or no useful groups', async () => {
    const unconfigured = makePorts({ settings: { ...makePorts().settings, loadProvider: vi.fn(async () => undefined) } })
    expect((await groupCurrentWindow(unconfigured, 'project')).ok).toBe(false)
    expect(unconfigured.workspace.apply).not.toHaveBeenCalled()
    const denied = makePorts({ permission: { contains: vi.fn(async () => false) } })
    expect((await groupCurrentWindow(denied, 'project')).ok).toBe(false)
    const empty = makePorts({ classifier: { classify: vi.fn(async () => ok({ groups: [] })) } })
    expect(await groupCurrentWindow(empty, 'project')).toEqual(ok({ groupCount: 0, tabCount: 0 }))
    expect(empty.workspace.apply).not.toHaveBeenCalled()
  })

  it('compensates after a partial apply failure', async () => {
    const ports = makePorts({ workspace: { capture: vi.fn(async () => ok(snapshot)), apply: vi.fn(async () => err({ code: 'apply-failed' as const, message: 'Tabs could not be grouped' })), restore: vi.fn(async () => ok(undefined)) } })
    expect((await groupCurrentWindow(ports, 'project')).ok).toBe(false)
    expect(ports.workspace.restore).toHaveBeenCalledWith(snapshot)
    expect(ports.undoValue).toBeUndefined()
  })

  it('retains recoverable pending state when compensation fails', async () => {
    const ports = makePorts({ workspace: { capture: vi.fn(async () => ok(snapshot)), apply: vi.fn(async () => err({ code: 'apply-failed' as const, message: 'Tabs could not be grouped' })), restore: vi.fn(async () => err({ code: 'apply-failed' as const, message: 'Restore failed' })) } })
    await groupCurrentWindow(ports, 'project')
    expect(ports.undoValue?.phase).toBe('pending')
  })

  it('restores and clears the latest undo only after success', async () => {
    const ports = makePorts(); ports.undoValue = { phase: 'ready', snapshot }
    expect(await undoLastGrouping(ports)).toEqual(ok(undefined))
    expect(ports.workspace.restore).toHaveBeenCalledWith(snapshot)
    expect(ports.undoValue).toBeUndefined()
  })
})

describe('keyboard shortcut', () => {
  it('groups with the lens saved from the popup', async () => {
    const ports = makePorts()
    vi.mocked(ports.settings.loadSelectedCriterion).mockResolvedValue('topic')
    await groupWithSavedLens(ports)
    expect(ports.classifier.classify).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ prompt: expect.stringContaining('Grouping lens: Topic') }))
  })
})

describe('popup state', () => {
  it('reports the eligible tab count and keeps a valid saved lens', async () => {
    const ports = makePorts()
    vi.mocked(ports.settings.loadSelectedCriterion).mockResolvedValue('session')
    const state = await getPopupState(ports)
    expect(state).toMatchObject({ selectedCriterion: 'session', eligibleTabCount: 2, configured: true })
    expect(ports.settings.saveSelectedCriterion).not.toHaveBeenCalled()
  })

  it('falls back to Project when the saved lens was deleted', async () => {
    const ports = makePorts()
    vi.mocked(ports.settings.loadSelectedCriterion).mockResolvedValue('deleted-custom-lens')
    expect((await getPopupState(ports)).selectedCriterion).toBe('project')
    expect(ports.settings.saveSelectedCriterion).toHaveBeenCalledWith('project')
  })
})
