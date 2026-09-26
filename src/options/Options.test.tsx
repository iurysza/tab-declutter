import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Options } from './Options'

it('adds, edits, removes, and saves custom criteria after permission', async () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'custom-id' })
  const save = vi.fn(async () => {})
  const revoke = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add custom lens' }))
  await userEvent.type(screen.getByLabelText('Custom lens 1 name'), 'Client')
  await userEvent.type(screen.getByLabelText('Custom lens 1 instruction'), 'Group by client')
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  expect(request).toHaveBeenCalled()
  expect(revoke).not.toHaveBeenCalled()
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', model: 'test-model' }), [{ id: 'custom-id', name: 'Client', instruction: 'Group by client' }])
  await userEvent.click(screen.getByRole('button', { name: 'Remove custom lens 1' }))
  expect(screen.queryByLabelText('Custom lens 1 name')).not.toBeInTheDocument()
})

it('rejects incomplete custom criteria before requesting permission', async () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'blank-id' })
  const save = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  const revoke = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add custom lens' }))
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))
  expect(await screen.findByText('Give each custom lens a name and an instruction, or remove it')).toBeInTheDocument()
  expect(request).not.toHaveBeenCalled()
  expect(save).not.toHaveBeenCalled()
})

it('reports permission denial without saving', async () => {
  const save = vi.fn(async () => {})
  const revoke = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request: vi.fn(async () => false), revoke }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(await screen.findByText('Chrome did not allow access to the provider. Nothing was saved.')).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
  expect(revoke).not.toHaveBeenCalled()
})

it('revokes the previous provider origin after a successful save to a different origin', async () => {
  const save = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  const revoke = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.selectOptions(screen.getByLabelText('Provider'), 'anthropic')
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(save).toHaveBeenCalled()
  expect(revoke).toHaveBeenCalledWith('https://api.openai.com/*')
})

it('does not revoke the origin when it stays the same', async () => {
  const save = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  const revoke = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(save).toHaveBeenCalled()
  expect(revoke).not.toHaveBeenCalled()
})

it('does not revoke when saving fails', async () => {
  const save = vi.fn(async () => { throw new Error('save failed') })
  const request = vi.fn(async () => true)
  const revoke = vi.fn(async () => {})
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(await screen.findByText('Settings could not be saved. Try again.')).toBeInTheDocument()
  expect(revoke).not.toHaveBeenCalled()
})

it('reports partial success when revocation fails after save', async () => {
  const save = vi.fn(async () => {})
  const request = vi.fn(async () => true)
  const revoke = vi.fn(async () => { throw new Error('remove failed') })
  render(<Options api={{ load: vi.fn(async () => ({ providerSettings: { provider: 'openai', apiKey: 'test-key', model: 'test-model' }, customCriteria: [] })), save, request, revoke }} />)
  await userEvent.selectOptions(screen.getByLabelText('Provider'), 'anthropic')
  await userEvent.click(await screen.findByRole('button', { name: 'Save settings' }))
  expect(save).toHaveBeenCalled()
  expect(await screen.findByText('Settings saved, but Chrome could not remove access to the previous provider')).toBeInTheDocument()
})
