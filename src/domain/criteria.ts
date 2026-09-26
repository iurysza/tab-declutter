import { z } from 'zod'

/**
 * What tab metadata a lens may send to the model.
 * - `basic`: reference, title, minimized URL.
 * - `session`: basic plus rounded last-used time and opener reference.
 */
export type TabSignals = 'basic' | 'session'

export interface BuiltInCriterion {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly signals: TabSignals
  readonly instruction: string
}

export const builtInCriteria = [
  {
    id: 'project',
    name: 'Project',
    description: 'Tabs that serve the same goal',
    signals: 'basic',
    instruction: [
      'Group tabs by the goal or deliverable they serve: a feature being built, a bug being fixed, a trip being planned, a purchase being decided.',
      'Tabs from different sites belong together when they serve the same goal. A pull request, its ticket, its CI run, and the docs used to write it form one group.',
      'Tabs on the same site do not belong together just because they share the site.',
      'If a tab could serve two goals, pick the one most other tabs point to.',
      'Name each group for the outcome, as a short verb phrase such as "Fix login redirect" or "Plan Lisbon trip". Never name a group after a website.',
    ].join('\n'),
  },
  {
    id: 'topic',
    name: 'Topic',
    description: 'Tabs about the same subject',
    signals: 'basic',
    instruction: [
      'Group tabs by the subject they are about, regardless of why they are open. Documentation, articles, videos, and discussions about the same subject belong together.',
      'Choose the level of detail that yields the most useful groups: "Kotlin coroutines" beats "Programming" when there are several tabs on it, but do not split a subject into groups of two.',
      'Name each group with a short noun phrase for the subject, such as "Kotlin coroutines" or "Running shoes".',
    ].join('\n'),
  },
  {
    id: 'session',
    name: 'Session',
    description: 'Tabs you opened or used around the same time',
    signals: 'session',
    instruction: [
      'Group tabs into browsing sessions: bursts of related activity that happened around the same time.',
      'Use these signals, strongest first:',
      '1. openedFrom: a tab opened from another tab usually belongs to the same session as that tab.',
      '2. lastUsed: tabs used within a short time of each other are likely one session. Tabs used days apart usually are not, unless they clearly continue the same thread.',
      '3. Tab order: neighboring tabs were often opened together.',
      'Content still matters. Do not merge two unrelated activities just because they happened at the same time.',
      'Name each group with when it happened and what it was about, such as "Just now: CI failure", "Earlier today: release notes", or "Last week: flat search". Derive the time words from lastUsed only. You do not know the clock time, so never say morning, evening, or a date.',
    ].join('\n'),
  },
  {
    id: 'next-step',
    name: 'Next step',
    description: 'What you still need to do with each tab',
    signals: 'basic',
    instruction: [
      'Group tabs by what the user most likely needs to do with them next. Use only these groups, and only when at least two tabs fit:',
      '"Act now": tabs that need a reply, review, decision, or form to finish, such as pull requests, open issues, email threads, or checkout pages.',
      '"Read later": articles, videos, and long posts not yet consumed.',
      '"Reference": docs, dashboards, and tools kept open to look things up while working.',
      '"Probably done": search result pages, finished confirmations, and tabs that look already handled.',
      'Use these exact group names so the user can recognize them across runs.',
    ].join('\n'),
  },
] as const satisfies readonly BuiltInCriterion[]

export type BuiltInCriterionId = (typeof builtInCriteria)[number]['id']
export const defaultCriterionId: BuiltInCriterionId = 'project'

export const customCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
})
export type CustomCriterion = z.infer<typeof customCriterionSchema>

/** A lens ready for prompting. Custom lenses always use basic signals. */
export interface Criterion {
  readonly id: string
  readonly name: string
  readonly instruction: string
  readonly signals: TabSignals
}

export function getCriterion(id: string, custom: readonly CustomCriterion[]): Criterion | undefined {
  const builtIn = builtInCriteria.find((item) => item.id === id)
  if (builtIn) return builtIn
  const found = custom.find((item) => item.id === id)
  return found && { ...found, signals: 'basic' }
}
