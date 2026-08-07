import { useEffect, useMemo, useState } from 'react'
import type { RuntimeRequest, RuntimeResponse } from '../application/runtime-messages'
import { Brand } from '../ui/components/Brand'
import { runtimeClient } from '../ui/runtime'
import '../ui/theme.css'
import './popup.css'

interface CriterionView { readonly id: string; readonly name: string; readonly description?: string }
interface PopupState { readonly configured: boolean; readonly criteria: readonly CriterionView[]; readonly selectedCriterion: string; readonly canUndo: boolean }
interface PopupApi { send(request: RuntimeRequest): Promise<RuntimeResponse>; openOptions(): Promise<void> }

export function Popup({ api = runtimeClient }: { readonly api?: PopupApi }) {
  const [state, setState] = useState<PopupState>()
  const [selected, setSelected] = useState('workstream')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'error' }>()

  const refresh = async () => {
    const response = await api.send({ type: 'get-popup-state' })
    if (response.ok) {
      const value = response.data as PopupState
      setState(value); setSelected(value.selectedCriterion)
    } else setNotice({ text: response.error.message, kind: 'error' })
  }
  useEffect(() => { void refresh() }, [])
  const criterion = useMemo(() => state?.criteria.find((item) => item.id === selected), [state, selected])

  const choose = async (id: string) => {
    setSelected(id)
    await api.send({ type: 'select-criterion', criterionId: id })
  }
  const group = async () => {
    setBusy(true); setNotice(undefined)
    const response = await api.send({ type: 'group-tabs', criterionId: selected })
    setBusy(false)
    if (!response.ok) return setNotice({ text: response.error.message, kind: 'error' })
    const outcome = response.data as { groupCount: number; tabCount: number }
    setNotice(outcome.groupCount ? { text: `${outcome.groupCount} groups · ${outcome.tabCount} tabs`, kind: 'success' } : { text: 'No useful groups found. Nothing changed', kind: 'success' })
    await refresh()
  }
  const undo = async () => {
    setBusy(true)
    const response = await api.send({ type: 'undo' })
    setBusy(false)
    setNotice(response.ok ? { text: 'Previous tab layout restored', kind: 'success' } : { text: response.error.message, kind: 'error' })
    if (response.ok) await refresh()
  }

  return <main className="popup-shell">
    <header><Brand compact /><button className="icon-button" onClick={() => void api.openOptions()} aria-label="Open settings">Settings</button></header>
    <section className="intro"><p className="eyebrow mono">CURRENT WINDOW</p><h1>Turn these tabs into threads.</h1></section>
    {state && <>
      <label>Group by<select value={selected} onChange={(event) => void choose(event.target.value)} disabled={busy}>{state.criteria.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <p className="criterion-copy">{criterion?.description}</p>
      {state.configured ? <button className="primary" onClick={() => void group()} disabled={busy}>{busy ? 'Finding the threads…' : 'Organise current window'}</button> : <button className="primary" onClick={() => void api.openOptions()}>Add a provider first</button>}
      {notice && <p role="status" className={`status ${notice.kind}`}>{notice.text}</p>}
      {state.canUndo && <button className="secondary undo" onClick={() => void undo()} disabled={busy}>Undo last grouping</button>}
    </>}
  </main>
}
