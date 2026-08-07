import { useEffect, useState } from 'react'
import { loadOptionsData, saveOptionsData } from '../adapters/chrome/chrome-storage'
import { requestProviderPermission } from '../adapters/chrome/chrome-permissions'
import { type CustomCriterion } from '../domain/criteria'
import { parseProviderSettings, providerKinds, type ProviderKind, type ProviderSettings } from '../domain/settings'
import { Brand } from '../ui/components/Brand'
import '../ui/theme.css'
import './options.css'

interface Draft { provider: ProviderKind; apiKey: string; model: string; baseUrl: string }
interface OptionsApi {
  load(): Promise<{ providerSettings?: unknown; customCriteria: readonly CustomCriterion[] }>
  save(settings: ProviderSettings, criteria: readonly CustomCriterion[]): Promise<void>
  request(settings: ProviderSettings): Promise<boolean>
}
const defaults: OptionsApi = { load: loadOptionsData, save: saveOptionsData, request: requestProviderPermission }
const empty: Draft = { provider: 'openai', apiKey: '', model: '', baseUrl: '' }

function toDraft(input: unknown): Draft {
  if (!input || typeof input !== 'object') return empty
  const value = input as Record<string, unknown>
  const provider = providerKinds.includes(value.provider as ProviderKind) ? value.provider as ProviderKind : 'openai'
  return { provider, apiKey: typeof value.apiKey === 'string' ? value.apiKey : '', model: typeof value.model === 'string' ? value.model : '', baseUrl: typeof value.baseUrl === 'string' ? value.baseUrl : '' }
}

export function Options({ api = defaults }: { readonly api?: OptionsApi }) {
  const [draft, setDraft] = useState<Draft>(empty)
  const [criteria, setCriteria] = useState<CustomCriterion[]>([])
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'error' }>()
  const [saving, setSaving] = useState(false)
  useEffect(() => { void api.load().then((data) => { setDraft(toDraft(data.providerSettings)); setCriteria([...data.customCriteria]) }) }, [])
  const field = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }))
  const save = async () => {
    setNotice(undefined)
    const parsed = parseProviderSettings(draft)
    if (!parsed.ok) return setNotice({ text: parsed.error.message, kind: 'error' })
    setSaving(true)
    try {
      if (!(await api.request(parsed.value))) return setNotice({ text: 'Provider access was not allowed', kind: 'error' })
      await api.save(parsed.value, criteria)
      setNotice({ text: 'Settings saved', kind: 'success' })
    } finally { setSaving(false) }
  }
  const add = () => setCriteria((items) => [...items, { id: crypto.randomUUID(), name: '', instruction: '' }])
  const updateCriterion = (id: string, key: 'name' | 'instruction', value: string) => setCriteria((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item))
  const remove = (id: string) => setCriteria((items) => items.filter((item) => item.id !== id))

  return <main className="options-shell">
    <header><Brand /><div className="privacy-badge mono">LOCAL BY DESIGN</div></header>
    <section><div className="section-heading"><p className="mono">01 · PROVIDER</p><h1>Your model, your key.</h1><p>Threadline calls this provider directly. The key stays in this Chrome profile and is never synced.</p></div>
      <div className="form-grid">
        <label>Provider<select value={draft.provider} onChange={(e) => field('provider', e.target.value)}>{providerKinds.map((kind) => <option key={kind} value={kind}>{kind === 'openai-compatible' ? 'OpenAI-compatible' : kind[0].toUpperCase() + kind.slice(1)}</option>)}</select></label>
        <label>Model<input value={draft.model} onChange={(e) => field('model', e.target.value)} placeholder="Provider model ID" /></label>
        <label className="wide">API key<input type="password" autoComplete="off" value={draft.apiKey} onChange={(e) => field('apiKey', e.target.value)} placeholder="Stored only in this profile" /></label>
        <label className="wide">Base URL {draft.provider !== 'openai-compatible' && <span>(optional)</span>}<input value={draft.baseUrl} onChange={(e) => field('baseUrl', e.target.value)} placeholder={draft.provider === 'openai-compatible' ? 'https://provider.example/v1' : 'Use provider default'} /></label>
      </div><p className="helper">Only tab titles, minimised URLs, and temporary tab references are sent. Page contents, history, cookies, and bookmarks are never read.</p>
    </section>
    <section><div className="section-heading"><p className="mono">02 · CRITERIA</p><h2>Your own grouping lens.</h2><p>Built-in Workstream, Topic, and Intent criteria are always available.</p></div>
      <div className="criteria-list">{criteria.map((item, index) => <div className="criterion-row" key={item.id}><label>Name<input aria-label={`Custom criterion ${index + 1} name`} value={item.name} onChange={(e) => updateCriterion(item.id, 'name', e.target.value)} placeholder="For example: Client" /></label><label>Instruction<textarea aria-label={`Custom criterion ${index + 1} instruction`} value={item.instruction} onChange={(e) => updateCriterion(item.id, 'instruction', e.target.value)} placeholder="Explain which tabs belong together and how to name them." /></label><button className="text-button danger" onClick={() => remove(item.id)}>Remove</button></div>)}</div>
      <button className="secondary" onClick={add}>Add criterion</button>
    </section>
    <footer><div>{notice && <p role="status" className={`status ${notice.kind}`}>{notice.text}</p>}</div><button className="primary save" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save settings'}</button></footer>
  </main>
}
