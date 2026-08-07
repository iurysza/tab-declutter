import { z } from 'zod'

export const builtInCriteria = [
  {
    id: 'workstream',
    name: 'Workstream',
    description: 'Same active task or deliverable',
    instruction: 'Group tabs that contribute to the same active task, project outcome, or deliverable. Name each group for the work being carried out using a concise task-oriented phrase.',
  },
  {
    id: 'topic',
    name: 'Topic',
    description: 'Same subject or domain',
    instruction: 'Group tabs by their shared subject or domain, regardless of the action being taken. Name each group with a concise subject phrase.',
  },
  {
    id: 'intent',
    name: 'Intent',
    description: 'Same immediate purpose',
    instruction: 'Group tabs by the user’s immediate activity or purpose, such as comparing, writing, monitoring, learning, or communicating. Name each group with a concise action phrase.',
  },
] as const

export type BuiltInCriterionId = (typeof builtInCriteria)[number]['id']

export const customCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
})
export type CustomCriterion = z.infer<typeof customCriterionSchema>
export type Criterion = (typeof builtInCriteria)[number] | CustomCriterion & { readonly description?: string }

export function getCriterion(id: string, custom: readonly CustomCriterion[]): Criterion | undefined {
  return builtInCriteria.find((item) => item.id === id) ?? custom.find((item) => item.id === id)
}
