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
  /** Milliseconds since epoch when the tab was last active. */
  readonly lastAccessed?: number
  /** Chrome ID of the tab that opened this one, while that tab still exists. */
  readonly openerTabId?: number
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
  /** Coarse, human-readable age such as "5 min ago". Never an exact timestamp. */
  readonly lastUsed?: string
  /** Reference (never a Chrome ID) of the eligible tab that opened this one. */
  readonly openedFrom?: string
}

export function isEligibleTab(tab: TabRecord): boolean {
  return !tab.pinned && (tab.splitViewId === undefined || tab.splitViewId === -1)
}

export function minimizeUrl(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.protocol === 'file:') return 'file://local'
    if (!['http:', 'https:'].includes(url.protocol)) return `${url.protocol}//`
    return `${url.origin}${url.pathname}`
  } catch {
    return ''
  }
}

const minute = 60_000
const hour = 60 * minute
const day = 24 * hour

/** Rounds an age into coarse buckets so the provider never sees exact browsing times. */
export function describeAge(lastAccessed: number, now: number): string {
  const age = Math.max(0, now - lastAccessed)
  if (age < 5 * minute) return 'just now'
  if (age < hour) return `${Math.round(age / (5 * minute)) * 5} min ago`
  if (age < day) return `${Math.round(age / hour)} h ago`
  if (age < 2 * day) return 'yesterday'
  if (age < 7 * day) return `${Math.round(age / day)} days ago`
  if (age < 30 * day) return `${Math.round(age / (7 * day))} weeks ago`
  return 'over a month ago'
}

/**
 * Turns eligible tabs into model-facing candidates with opaque references.
 * Candidates carry every signal; the prompt decides which ones a lens may send.
 */
export function createCandidates(tabs: readonly TabRecord[], now: number): readonly TabCandidate[] {
  const eligible = tabs.filter(isEligibleTab)
  const referenceById = new Map(eligible.map((tab, index) => [tab.id, `T${index + 1}`]))
  return eligible.map((tab) => {
    const openedFrom = tab.openerTabId === undefined ? undefined : referenceById.get(tab.openerTabId)
    return {
      id: tab.id,
      reference: referenceById.get(tab.id)!,
      title: tab.title,
      url: minimizeUrl(tab.url),
      ...(tab.lastAccessed !== undefined ? { lastUsed: describeAge(tab.lastAccessed, now) } : {}),
      ...(openedFrom ? { openedFrom } : {}),
    }
  })
}
