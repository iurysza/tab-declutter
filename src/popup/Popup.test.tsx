import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { RuntimeRequest } from '../application/runtime-messages'
import { Popup } from './Popup'

const criteria = [
  { id: 'project', name: 'Project', description: 'Tabs that serve the same goal' },
  { id: 'topic', name: 'Topic', description: 'Tabs about the same subject' },
]

function api(overrides: { configured?: boolean; selectedCriterion?: string; canUndo?: boolean; eligibleTabCount?: number; shortcut?: string } = {}) {
  const send = vi.fn(async (request: RuntimeRequest) => {
    if (request.type === 'get-popup-state') {
      return { ok: true as const, data: { configured: overrides.configured ?? true, criteria, selectedCriterion: overrides.selectedCriterion ?? 'project', canUndo: overrides.canUndo ?? false, eligibleTabCount: overrides.eligibleTabCount ?? 6 } }
    }
    if (request.type === 'group-tabs') return { ok: true as const, data: { groupCount: 1, tabCount: 2 } }
    return { ok: true as const }
  })
  return {
    send,
    openOptions: vi.fn(async () => {}),
    getShortcut: vi.fn(async () => overrides.shortcut),
    openShortcutSettings: vi.fn(async () => {}),
  }
}

it('groups with the selected lens and offers undo inline', async () => {
  const client = api({ canUndo: true })
  render(<Popup api={client} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Group 6 tabs' }))
  expect(client.send).toHaveBeenCalledWith({ type: 'group-tabs', criterionId: 'project' })
  expect(await screen.findByText('Made 1 group from 2 tabs')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
})

it('restores the saved lens and persists a new choice', async () => {
  const client = api({ selectedCriterion: 'topic' })
  render(<Popup api={client} />)
  expect(await screen.findByRole('radio', { name: /Topic/ })).toBeChecked()
  await userEvent.click(screen.getByRole('radio', { name: /Project/ }))
  expect(client.send).toHaveBeenCalledWith({ type: 'select-criterion', criterionId: 'project' })
})

it('shows the assigned keyboard shortcut', async () => {
  render(<Popup api={api({ shortcut: '⌥⇧G' })} />)
  expect(await screen.findByText('⌥⇧G')).toBeInTheDocument()
})

it('offers to set a shortcut when none is assigned', async () => {
  const client = api()
  render(<Popup api={client} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Set one' }))
  expect(client.openShortcutSettings).toHaveBeenCalled()
})

it('disables grouping when there are fewer than two tabs', async () => {
  render(<Popup api={api({ eligibleTabCount: 1 })} />)
  expect(await screen.findByRole('button', { name: 'Group 1 tab' })).toBeDisabled()
  expect(screen.getByText('Open at least two unpinned tabs to group them.')).toBeInTheDocument()
})

it('directs an unconfigured user to settings', async () => {
  const client = api({ configured: false })
  render(<Popup api={client} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Open settings' }))
  expect(client.openOptions).toHaveBeenCalled()
})
