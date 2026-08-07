export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export type ErrorCode =
  | 'not-configured'
  | 'not-enough-tabs'
  | 'permission-missing'
  | 'provider-auth'
  | 'provider-rate-limit'
  | 'provider-unreachable'
  | 'invalid-response'
  | 'apply-failed'
  | 'nothing-to-undo'
  | 'invalid-request'

export interface AppError {
  readonly code: ErrorCode
  readonly message: string
}
