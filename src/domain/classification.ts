import { z } from 'zod'
import type { GroupColor, TabCandidate } from './tabs'

export const classificationSchema = z.object({
  groups: z.array(z.object({
    name: z.string(),
    tabs: z.array(z.string()),
  })),
})
export type ModelClassification = z.infer<typeof classificationSchema>

export interface PlannedGroup {
  readonly name: string
  readonly tabIds: readonly number[]
  readonly color: GroupColor
}
export interface GroupingPlan {
  readonly groups: readonly PlannedGroup[]
  readonly ungroupedTabIds: readonly number[]
}

const colors: readonly GroupColor[] = ['blue', 'purple', 'green', 'orange', 'cyan', 'pink', 'yellow', 'red', 'grey']

export function normalizeClassification(
  candidates: readonly TabCandidate[],
  classification: ModelClassification,
): GroupingPlan {
  const byReference = new Map(candidates.map((tab) => [tab.reference, tab.id]))
  const assigned = new Set<number>()
  const groups: PlannedGroup[] = []
  for (const raw of classification.groups) {
    const name = raw.name.trim()
    if (!name) continue
    const ids: number[] = []
    for (const reference of raw.tabs) {
      const id = byReference.get(reference)
      if (id === undefined || assigned.has(id) || ids.includes(id)) continue
      ids.push(id)
    }
    if (ids.length < 2) continue
    ids.forEach((id) => assigned.add(id))
    groups.push({ name, tabIds: ids, color: colors[groups.length % colors.length] })
  }
  return {
    groups,
    ungroupedTabIds: candidates.map((tab) => tab.id).filter((id) => !assigned.has(id)),
  }
}
