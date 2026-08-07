import type { PriorGroup, WindowSnapshot } from './tabs'

export interface RestorePlan {
  readonly orderedTabIds: readonly number[]
  readonly groups: readonly Omit<PriorGroup, 'id'>[]
}

export function buildRestorePlan(snapshot: WindowSnapshot, liveTabIds: ReadonlySet<number>): RestorePlan {
  const orderedTabIds = snapshot.tabs
    .filter((tab) => liveTabIds.has(tab.id) && !tab.pinned && (tab.splitViewId === undefined || tab.splitViewId === -1))
    .sort((a, b) => a.index - b.index)
    .map((tab) => tab.id)
  const eligible = new Set(orderedTabIds)
  const groups = snapshot.groups
    .map(({ title, color, collapsed, tabIds }) => ({ title, color, collapsed, tabIds: tabIds.filter((id) => eligible.has(id)) }))
    .filter((group) => group.tabIds.length > 0)
  return { orderedTabIds, groups }
}
