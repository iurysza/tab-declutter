import type { WorkspacePort } from '../../application/ports'
import type { GroupingPlan } from '../../domain/classification'
import { err, ok } from '../../domain/result'
import { buildRestorePlan } from '../../domain/undo'
import type { GroupColor, TabRecord, WindowSnapshot } from '../../domain/tabs'

function failure() { return err({ code: 'apply-failed' as const, message: 'Tabs could not be grouped. Use Undo to restore them' }) }
function toRecord(tab: chrome.tabs.Tab): TabRecord | undefined {
  if (tab.id === undefined || !tab.title || !tab.url) return undefined
  return { id: tab.id, windowId: tab.windowId, index: tab.index, title: tab.title, url: tab.url, pinned: tab.pinned, splitViewId: tab.splitViewId, groupId: tab.groupId }
}
async function surviving(ids: readonly number[]): Promise<number[]> {
  const values = await Promise.all(ids.map(async (id) => { try { await chrome.tabs.get(id); return id } catch { return undefined } }))
  return values.filter((id): id is number => id !== undefined)
}
function nonEmpty(ids: number[]): [number, ...number[]] {
  if (ids.length === 0) throw new Error('Expected at least one tab')
  return ids as [number, ...number[]]
}

export const chromeWorkspace: WorkspacePort = {
  async capture() {
    try {
      const tabs = (await chrome.tabs.query({ currentWindow: true })).flatMap((tab) => { const record = toRecord(tab); return record ? [record] : [] })
      if (!tabs[0]) return failure()
      const rawGroups = await chrome.tabGroups.query({ windowId: tabs[0].windowId })
      const groups = rawGroups.map((group) => ({
        id: group.id,
        title: group.title ?? '',
        color: group.color as GroupColor,
        collapsed: group.collapsed,
        tabIds: tabs.filter((tab) => tab.groupId === group.id).map((tab) => tab.id),
      }))
      return ok({ windowId: tabs[0].windowId, tabs, groups })
    } catch { return failure() }
  },

  async apply(plan: GroupingPlan, snapshot: WindowSnapshot) {
    try {
      const affected = await surviving([...plan.groups.flatMap((group) => group.tabIds), ...plan.ungroupedTabIds])
      const currentlyGrouped = snapshot.tabs.filter((tab) => affected.includes(tab.id) && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map((tab) => tab.id)
      if (currentlyGrouped.length) await chrome.tabs.ungroup(nonEmpty(currentlyGrouped))
      for (const group of plan.groups) {
        const tabIds = await surviving(group.tabIds)
        if (tabIds.length < 2) continue
        const groupId = await chrome.tabs.group({ tabIds: nonEmpty(tabIds), createProperties: { windowId: snapshot.windowId } })
        await chrome.tabGroups.update(groupId!, { title: group.name, color: group.color, collapsed: false })
      }
      return ok(undefined)
    } catch { return failure() }
  },

  async restore(snapshot: WindowSnapshot) {
    try {
      const live = new Set(await surviving(snapshot.tabs.map((tab) => tab.id)))
      const plan = buildRestorePlan(snapshot, live)
      const current = await chrome.tabs.query({ windowId: snapshot.windowId })
      const grouped = current.filter((tab) => tab.id !== undefined && plan.orderedTabIds.includes(tab.id) && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).flatMap((tab) => tab.id ?? [])
      if (grouped.length) await chrome.tabs.ungroup(nonEmpty(grouped))
      const byId = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
      for (const id of plan.orderedTabIds) await chrome.tabs.move(id, { index: byId.get(id)!.index })
      for (const group of plan.groups) {
        const tabIds = await surviving(group.tabIds)
        if (!tabIds.length) continue
        const groupId = await chrome.tabs.group({ tabIds: nonEmpty(tabIds), createProperties: { windowId: snapshot.windowId } })
        await chrome.tabGroups.update(groupId!, { title: group.title, color: group.color, collapsed: group.collapsed })
      }
      return ok(undefined)
    } catch { return failure() }
  },
}
