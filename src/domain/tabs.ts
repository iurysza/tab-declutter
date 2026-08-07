export type GroupColor = 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan' | 'orange'

export interface TabRecord {
  readonly id: number
  readonly windowId: number
  readonly index: number
  readonly title: string
  readonly url: string
  readonly pinned: boolean
  readonly splitViewId?: number
  readonly groupId: number
}

export interface PriorGroup {
  readonly id: number
  readonly title: string
  readonly color: GroupColor
  readonly collapsed: boolean
  readonly tabIds: readonly number[]
}

export interface WindowSnapshot {
  readonly windowId: number
  readonly tabs: readonly TabRecord[]
  readonly groups: readonly PriorGroup[]
}

export interface TabCandidate {
  readonly id: number
  readonly reference: string
  readonly title: string
  readonly url: string
}

export function isEligibleTab(tab: TabRecord): boolean {
  return !tab.pinned && (tab.splitViewId === undefined || tab.splitViewId === -1)
}

export function minimiseUrl(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.protocol === 'file:') return 'file://local'
    if (!['http:', 'https:'].includes(url.protocol)) return `${url.protocol}//`
    return `${url.origin}${url.pathname}`
  } catch {
    return ''
  }
}

export function createCandidates(tabs: readonly TabRecord[]): readonly TabCandidate[] {
  return tabs.filter(isEligibleTab).map((tab, index) => ({
    id: tab.id,
    reference: `T${index + 1}`,
    title: tab.title,
    url: minimiseUrl(tab.url),
  }))
}
