import { z } from 'zod'

export const requestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('get-popup-state') }),
  z.object({ type: z.literal('group-tabs'), criterionId: z.string().min(1) }),
  z.object({ type: z.literal('undo') }),
  z.object({ type: z.literal('select-criterion'), criterionId: z.string().min(1) }),
])
export type RuntimeRequest = z.infer<typeof requestSchema>
export type RuntimeResponse =
  | { readonly ok: true; readonly data?: unknown }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } }
