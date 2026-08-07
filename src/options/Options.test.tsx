import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Options } from './Options'

it('adds, edits, removes, and saves custom criteria after permission', async () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'custom-id' })
  const save = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add criterion' }))
  await userEvent.type(screen.getByLabelText('Custom criterion 1 name'), 'Client')
  await userEvent.type(screen.getByLabelText('Custom criterion 1 instruction'), 'Group by client')
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  expect(request).toHaveBeenCalled()
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', model: 'test-model' }), [{ id: 'custom-id', name: 'Client', instruction: 'Group by client' }])
  await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
  expect(screen.queryByLabelText('Custom criterion 1 name')).not.toBeInTheDocument()
})

it('reports permission denial without saving', async () => {
  const save = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request: vi.fn(async () => false) }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(await screen.findByText('Provider access was not allowed')).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
})
