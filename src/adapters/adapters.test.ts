import { describe, expect, it, vi } from 'vitest'
import { safeProviderError } from './ai/ai-sdk-classifier'
import { removeProviderPermission, requestProviderPermission } from './chrome/chrome-permissions'
import { chromeWorkspace } from './chrome/chrome-workspace'
import { chromeUndo, saveOptionsData } from './chrome/chrome-storage'
import type { ProviderSettings } from '../domain/settings'

const settings: ProviderSettings = { provider: 'openai-compatible', apiKey: 'test-key', model: 'local', baseUrl: 'http://localhost:11434/v1' }

describe('edge adapters', () => {
  it('requests only the configured provider origin', async () => {
    const request = vi.fn(async () => true)
    vi.stubGlobal('chrome', { permissions: { request } })
    expect(await requestProviderPermission(settings)).toBe(true)
    expect(request).toHaveBeenCalledWith({ origins: ['http://localhost:11434/*'] })
  })

  it('removes a previously granted provider origin', async () => {
    const remove = vi.fn(async () => true)
    vi.stubGlobal('chrome', { permissions: { remove } })
    expect(await removeProviderPermission('https://api.openai.com/*')).toBe(true)
    expect(remove).toHaveBeenCalledWith({ origins: ['https://api.openai.com/*'] })
  })

  it('translates provider failures without leaking dependency messages', () => {
    expect(safeProviderError({ statusCode: 401, message: 'test-key leaked' })).toEqual({ code: 'provider-auth', message: 'Check the provider API key' })
    expect(safeProviderError({ statusCode: 429 })).toEqual({ code: 'provider-rate-limit', message: 'The provider is busy. Try again shortly' })
  })

  it('keeps settings local and crash recovery in session storage', async () => {
    const localSet = vi.fn(async () => {})
    const sessionSet = vi.fn(async () => {})
    vi.stubGlobal('chrome', { storage: { local: { set: localSet }, session: { set: sessionSet } } })
    await saveOptionsData(settings, [])
    await chromeUndo.save({ phase: 'ready', snapshot: { windowId: 1, tabs: [], groups: [] } })
    expect(localSet).toHaveBeenCalledWith(expect.objectContaining({ providerSettings: settings, customCriteria: [] }))
    expect(sessionSet).toHaveBeenCalledWith(expect.objectContaining({ undoRecord: expect.objectContaining({ phase: 'ready' }) }))
  })

  it('captures, groups, names, and restores through Chrome APIs in order', async () => {
    const tabs = [
      { id: 1, windowId: 5, index: 0, title: 'A', url: 'https://a.test', pinned: false, groupId: -1 },
      { id: 2, windowId: 5, index: 1, title: 'B', url: 'https://b.test', pinned: false, groupId: -1 },
    ]
    const query = vi.fn(async () => tabs)
    const group = vi.fn(async () => 7)
    const ungroup = vi.fn(async () => {})
    const move = vi.fn(async () => {})
    const update = vi.fn(async () => {})
    vi.stubGlobal('chrome', { tabs: { query, get: vi.fn(async (id) => tabs.find((tab) => tab.id === id)), group, ungroup, move }, tabGroups: { TAB_GROUP_ID_NONE: -1, query: vi.fn(async () => []), update } })
    const captured = await chromeWorkspace.capture()
    expect(captured.ok).toBe(true)
    if (!captured.ok) return
    await chromeWorkspace.apply({ groups: [{ name: 'Work', tabIds: [1, 2], color: 'blue' }], ungroupedTabIds: [] }, captured.value)
    expect(group).toHaveBeenCalledWith({ tabIds: [1, 2], createProperties: { windowId: 5 } })
    expect(update).toHaveBeenCalledWith(7, { title: 'Work', color: 'blue', collapsed: false })
    await chromeWorkspace.restore(captured.value)
    expect(move).toHaveBeenCalledTimes(2)
  })
})
