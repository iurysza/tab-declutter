import { Check, CircleAlert, Eye, EyeOff, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { removeProviderPermission, requestProviderPermission } from '../adapters/chrome/chrome-permissions'
import { loadOptionsData, saveOptionsData } from '../adapters/chrome/chrome-storage'
import { builtInCriteria, customCriterionSchema, type CustomCriterion } from '../domain/criteria'
import { parseProviderSettings, providerKinds, providerOriginPattern, type ProviderKind, type ProviderSettings } from '../domain/settings'
import { Brand } from '../ui/components/Brand'
import '../ui/theme.css'
import './options.css'

interface Draft { provider: ProviderKind; apiKey: string; model: string; baseUrl: string }
type Notice = { readonly kind: 'success' | 'error'; readonly text: string }

export interface OptionsApi {
  load(): Promise<{ providerSettings?: unknown; customCriteria: readonly CustomCriterion[] }>
  save(settings: ProviderSettings, criteria: readonly CustomCriterion[]): Promise<void>
  request(settings: ProviderSettings): Promise<boolean>
  revoke(origin: string): Promise<void>
}

const chromeOptionsApi: OptionsApi = {
  load: loadOptionsData,
  save: saveOptionsData,
  request: requestProviderPermission,
  revoke: async (origin) => { await removeProviderPermission(origin) },
}

const providerLabels: Record<ProviderKind, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google Gemini',
  'openai-compatible': 'OpenAI-compatible',
}

const modelPlaceholders: Record<ProviderKind, string> = {
  openai: 'e.g. gpt-5-mini',
  anthropic: 'e.g. claude-haiku-4-5',
  google: 'e.g. gemini-2.5-flash',
  'openai-compatible': 'Model ID from your provider',
}

const emptyDraft: Draft = { provider: 'openai', apiKey: '', model: '', baseUrl: '' }

function toDraft(input: unknown): Draft {
  if (!input || typeof input !== 'object') return emptyDraft
  const value = input as Record<string, unknown>
  const text = (key: string) => (typeof value[key] === 'string' ? value[key] as string : '')
  const provider = providerKinds.includes(value.provider as ProviderKind) ? value.provider as ProviderKind : 'openai'
  return { provider, apiKey: text('apiKey'), model: text('model'), baseUrl: text('baseUrl') }
}

function savedSettings(input: unknown): ProviderSettings | undefined {
  const parsed = parseProviderSettings(input)
  return parsed.ok ? parsed.value : undefined
}

export function Options({ api = chromeOptionsApi }: { readonly api?: OptionsApi }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saved, setSaved] = useState<ProviderSettings>()
  const [criteria, setCriteria] = useState<CustomCriterion[]>([])
  const [notice, setNotice] = useState<Notice>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.load().then(
      (data) => {
        setDraft(toDraft(data.providerSettings))
        setSaved(savedSettings(data.providerSettings))
        setCriteria([...data.customCriteria])
      },
      () => setNotice({ kind: 'error', text: 'Settings could not be loaded. Reload the page to try again.' }),
    )
  }, [])

  const setField = (key: keyof Draft, value: string) => {
    setNotice(undefined)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    setNotice(undefined)
    const parsed = parseProviderSettings(draft)
    if (!parsed.ok) return setNotice({ kind: 'error', text: parsed.error.message })
    const validCriteria: CustomCriterion[] = []
    for (const criterion of criteria) {
      const result = customCriterionSchema.safeParse(criterion)
      if (!result.success) return setNotice({ kind: 'error', text: 'Give each custom lens a name and an instruction, or remove it' })
      validCriteria.push(result.data)
    }
    setSaving(true)
    try {
      if (!(await api.request(parsed.value))) return setNotice({ kind: 'error', text: 'Chrome did not allow access to the provider. Nothing was saved.' })
      await api.save(parsed.value, validCriteria)
      const previousPattern = saved ? providerOriginPattern(saved) : undefined
      let result: Notice = { kind: 'success', text: 'Settings saved' }
      if (previousPattern && previousPattern !== providerOriginPattern(parsed.value)) {
        try {
          await api.revoke(previousPattern)
        } catch {
          result = { kind: 'error', text: 'Settings saved, but Chrome could not remove access to the previous provider' }
        }
      }
      setSaved(parsed.value)
      setNotice(result)
    } catch {
      setNotice({ kind: 'error', text: 'Settings could not be saved. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const addCriterion = () => setCriteria((items) => [...items, { id: crypto.randomUUID(), name: '', instruction: '' }])
  const updateCriterion = (id: string, key: 'name' | 'instruction', value: string) => {
    setNotice(undefined)
    setCriteria((items) => items.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }
  const removeCriterion = (id: string) => setCriteria((items) => items.filter((item) => item.id !== id))

  return (
    <main className="options">
      <header className="options-header">
        <Brand size={32} subtitle="Settings" />
      </header>

      <section className="panel" aria-labelledby="provider-heading">
        <div className="panel-heading">
          <h2 id="provider-heading">Model provider</h2>
          <p>Tab Declutter calls your provider directly with your own API key. There is no Tab Declutter server.</p>
        </div>
        <ProviderFields draft={draft} setField={setField} />
        <PrivacyNote />
      </section>

      <section className="panel" aria-labelledby="lenses-heading">
        <div className="panel-heading">
          <h2 id="lenses-heading">Grouping lenses</h2>
          <p>A lens tells the model how to decide which tabs belong together.</p>
        </div>
        <ul className="lens-list">
          {builtInCriteria.map((item) => (
            <li key={item.id} className="lens-item">
              <span className="lens-item-name">{item.name}</span>
              <span className="lens-item-description">{item.description}</span>
              <span className="tag">Built in</span>
            </li>
          ))}
        </ul>
        {criteria.map((item, index) => (
          <CustomLens key={item.id} index={index} criterion={item} onChange={updateCriterion} onRemove={removeCriterion} />
        ))}
        <button className="button button-secondary add-lens" onClick={addCriterion}>
          <Plus size={15} strokeWidth={1.75} />
          Add custom lens
        </button>
      </section>

      <footer className="save-bar">
        <div aria-live="polite">
          {notice && (
            <p role="status" className={`notice notice-${notice.kind}`}>
              {notice.kind === 'success' ? <Check size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
              <span>{notice.text}</span>
            </p>
          )}
        </div>
        <button className="button button-primary button-large" disabled={saving} onClick={() => void save()}>
          {saving && <LoaderCircle size={16} className="spinner" aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </footer>
    </main>
  )
}

function ProviderFields({ draft, setField }: { readonly draft: Draft; readonly setField: (key: keyof Draft, value: string) => void }) {
  const [showKey, setShowKey] = useState(false)
  const id = useId()
  const needsBaseUrl = draft.provider === 'openai-compatible'
  return (
    <div className="form-grid">
      <div className="field">
        <label className="field-label" htmlFor={`${id}-provider`}>Provider</label>
        <select id={`${id}-provider`} className="input" value={draft.provider} onChange={(e) => setField('provider', e.target.value)}>
          {providerKinds.map((kind) => <option key={kind} value={kind}>{providerLabels[kind]}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-model`}>Model ID</label>
        <input id={`${id}-model`} className="input" value={draft.model} onChange={(e) => setField('model', e.target.value)} placeholder={modelPlaceholders[draft.provider]} spellCheck={false} />
      </div>
      <div className="field wide">
        <label className="field-label" htmlFor={`${id}-key`}>API key</label>
        <div className="input-with-action">
          <input id={`${id}-key`} className="input" type={showKey ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={draft.apiKey} onChange={(e) => setField('apiKey', e.target.value)} placeholder="Paste your key" />
          <button type="button" className="button button-ghost button-icon" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>
            {showKey ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      <div className="field wide">
        <label className="field-label" htmlFor={`${id}-base`}>
          Base URL
          {!needsBaseUrl && <span className="field-hint">Optional</span>}
        </label>
        <input id={`${id}-base`} className="input" value={draft.baseUrl} onChange={(e) => setField('baseUrl', e.target.value)} placeholder={needsBaseUrl ? 'https://api.example.com/v1' : 'Leave empty to use the default'} spellCheck={false} />
      </div>
    </div>
  )
}

function PrivacyNote() {
  return (
    <div className="privacy">
      <div>
        <h3>Sent to your provider</h3>
        <ul>
          <li>Tab titles</li>
          <li>Tab URLs, without query strings or fragments</li>
          <li>The lens instruction you picked</li>
          <li>Session lens only: roughly when each tab was last used, and which tab opened it</li>
        </ul>
      </div>
      <div>
        <h3>Never read or sent</h3>
        <ul>
          <li>Page contents</li>
          <li>History, bookmarks, and cookies</li>
          <li>Your API key, except to your provider</li>
        </ul>
      </div>
    </div>
  )
}

function CustomLens({ index, criterion, onChange, onRemove }: {
  readonly index: number
  readonly criterion: CustomCriterion
  readonly onChange: (id: string, key: 'name' | 'instruction', value: string) => void
  readonly onRemove: (id: string) => void
}) {
  const id = useId()
  const number = index + 1
  return (
    <div className="custom-lens">
      <div className="custom-lens-header">
        <div className="field">
          <label className="field-label" htmlFor={`${id}-name`}>Name</label>
          <input id={`${id}-name`} className="input" aria-label={`Custom lens ${number} name`} value={criterion.name} onChange={(e) => onChange(criterion.id, 'name', e.target.value)} placeholder="e.g. Client" />
        </div>
        <button className="button button-ghost button-icon" onClick={() => onRemove(criterion.id)} aria-label={`Remove custom lens ${number}`} title="Remove">
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-instruction`}>Instruction</label>
        <textarea id={`${id}-instruction`} className="input" aria-label={`Custom lens ${number} instruction`} value={criterion.instruction} onChange={(e) => onChange(criterion.id, 'instruction', e.target.value)} placeholder="e.g. Group tabs by the client they relate to. Name each group after the client." />
      </div>
    </div>
  )
}
