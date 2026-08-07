import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Popup } from './Popup'

it('groups with a selected criterion and exposes undo', async () => {
  const send = vi.fn(async (request) => request.type === 'get-popup-state'
    ? { ok: true as const, data: { configured: true, criteria: [{ id: 'workstream', name: 'Workstream', description: 'Same active task' }], selectedCriterion: 'workstream', canUndo: true } }
    : { ok: true as const, data: request.type === 'group-tabs' ? { groupCount: 1, tabCount: 2 } : undefined })
  render(<Popup api={{ send, openOptions: vi.fn(async () => {}) }} />)
  await screen.findByRole('button', { name: 'Organise current window' })
  await userEvent.click(screen.getByRole('button', { name: 'Organise current window' }))
  expect(await screen.findByText('1 groups · 2 tabs')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Undo last grouping' })).toBeInTheDocument()
})

it('directs an unconfigured user to settings', async () => {
  const openOptions = vi.fn(async () => {})
  render(<Popup api={{ send: vi.fn(async () => ({ ok: true as const, data: { configured: false, criteria: [], selectedCriterion: 'workstream', canUndo: false } })), openOptions }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add a provider first' }))
  expect(openOptions).toHaveBeenCalled()
})
