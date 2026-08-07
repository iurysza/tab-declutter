import { err, ok, type AppError, type Result } from '../domain/result'
import type { AppPorts } from './ports'

export async function undoLastGrouping(ports: AppPorts): Promise<Result<void, AppError>> {
  const record = await ports.undo.load()
  if (!record) return err({ code: 'nothing-to-undo', message: 'Nothing to undo' })
  const restored = await ports.workspace.restore(record.snapshot)
  if (!restored.ok) return restored
  if (record.phase === 'pending' && record.previous) await ports.undo.save(record.previous)
  else await ports.undo.clear()
  return ok(undefined)
}
