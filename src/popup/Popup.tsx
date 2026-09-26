import { Check, CircleAlert, LoaderCircle, RotateCcw, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PopupState } from '../application/get-popup-state'
import type { GroupingOutcome } from '../application/group-current-window'
import type { RuntimeRequest, RuntimeResponse } from '../application/runtime-messages'
import { defaultCriterionId } from '../domain/criteria'
import { BrandMark } from '../ui/components/Brand'
import { plural } from '../ui/plural'
import { runtimeClient } from '../ui/runtime'
import '../ui/theme.css'
import './popup.css'

interface PopupApi {
  send(request: RuntimeRequest): Promise<RuntimeResponse>
  openOptions(): Promise<void>
  getShortcut(): Promise<string | undefined>
  openShortcutSettings(): Promise<void>
}

type Notice =
  | { readonly kind: 'grouped'; readonly text: string }
  | { readonly kind: 'info'; readonly text: string }
  | { readonly kind: 'error'; readonly text: string }

type Busy = 'grouping' | 'undoing' | undefined

export function Popup({ api = runtimeClient }: { readonly api?: PopupApi }) {
  const [state, setState] = useState<PopupState>()
  const [selected, setSelected] = useState<string>(defaultCriterionId)
  const [busy, setBusy] = useState<Busy>()
  const [notice, setNotice] = useState<Notice>()
  const [shortcut, setShortcut] = useState<string>()

  const refresh = async () => {
    const response = await api.send({ type: 'get-popup-state' })
    if (!response.ok) return setNotice({ kind: 'error', text: response.error.message })
    const value = response.data as PopupState
    setState(value)
    setSelected(value.selectedCriterion)
  }
  useEffect(() => {
    void refresh()
    api.getShortcut().then(setShortcut, () => setShortcut(undefined))
  }, [])

  const choose = (id: string) => {
    setSelected(id)
    void api.send({ type: 'select-criterion', criterionId: id })
  }

  const group = async () => {
    setBusy('grouping')
    setNotice(undefined)
    const response = await api.send({ type: 'group-tabs', criterionId: selected })
    setBusy(undefined)
    if (!response.ok) return setNotice({ kind: 'error', text: response.error.message })
    const { groupCount, tabCount } = response.data as GroupingOutcome
    setNotice(groupCount
      ? { kind: 'grouped', text: `Made ${plural(groupCount, 'group')} from ${plural(tabCount, 'tab')}` }
      : { kind: 'info', text: 'No clear groups found. Nothing changed.' })
    await refresh()
  }

  const undo = async () => {
    setBusy('undoing')
    const response = await api.send({ type: 'undo' })
    setBusy(undefined)
    setNotice(response.ok
      ? { kind: 'info', text: 'Tabs are back where they were.' }
      : { kind: 'error', text: response.error.message })
    if (response.ok) await refresh()
  }

  return (
    <main className="popup">
      <header className="popup-header">
        <div className="brand">
          <BrandMark size={22} />
          <strong>Tab Declutter</strong>
        </div>
        <button className="button button-ghost button-icon" onClick={() => void api.openOptions()} aria-label="Settings" title="Settings">
          <Settings size={16} strokeWidth={1.75} />
        </button>
      </header>

      {state && !state.configured && <Setup onOpen={() => void api.openOptions()} />}

      {state?.configured && (
        <>
          <fieldset className="lenses" disabled={busy !== undefined}>
            <legend>Group tabs by</legend>
            {state.criteria.map((item) => (
              <label key={item.id} className="lens" data-selected={item.id === selected}>
                <input type="radio" name="lens" value={item.id} checked={item.id === selected} onChange={() => choose(item.id)} className="visually-hidden" />
                <span className="lens-radio" aria-hidden="true" />
                <span className="lens-text">
                  <span className="lens-name">{item.name}</span>
                  <span className="lens-description">{item.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="popup-actions">
            <GroupButton busy={busy} count={state.eligibleTabCount} onClick={() => void group()} />
            {notice && <Result notice={notice} canUndo={state.canUndo} busy={busy} onUndo={() => void undo()} />}
            {!notice && state.canUndo && (
              <button className="button button-ghost undo-link" onClick={() => void undo()} disabled={busy !== undefined}>
                <RotateCcw size={14} strokeWidth={1.75} />
                Undo last grouping
              </button>
            )}
          </div>

          <ShortcutHint shortcut={shortcut} onEdit={() => void api.openShortcutSettings()} />
        </>
      )}

      {!state && notice && <p role="status" className="notice notice-error">{notice.text}</p>}
    </main>
  )
}

function ShortcutHint({ shortcut, onEdit }: { readonly shortcut?: string; readonly onEdit: () => void }) {
  return (
    <p className="shortcut">
      {shortcut
        ? <><kbd>{shortcut}</kbd> groups with this lens.</>
        : <>No keyboard shortcut set.</>}
      {' '}
      <button className="link" onClick={onEdit}>{shortcut ? 'Change' : 'Set one'}</button>
    </p>
  )
}

function Setup({ onOpen }: { readonly onOpen: () => void }) {
  return (
    <section className="setup">
      <h1>Connect a model to start</h1>
      <p>Tab Declutter uses your own API key to name and group tabs. Add a provider in Settings. It takes a minute.</p>
      <button className="button button-primary button-large" onClick={onOpen}>Open settings</button>
    </section>
  )
}

function GroupButton({ busy, count, onClick }: { readonly busy: Busy; readonly count?: number; readonly onClick: () => void }) {
  const tooFew = count !== undefined && count < 2
  const label = busy === 'grouping' ? 'Grouping tabs…' : count === undefined ? 'Group tabs' : `Group ${plural(count, 'tab')}`
  return (
    <>
      <button className="button button-primary button-large" onClick={onClick} disabled={busy !== undefined || tooFew}>
        {busy === 'grouping' && <LoaderCircle size={16} className="spinner" aria-hidden="true" />}
        {label}
      </button>
      {tooFew && <p className="popup-hint">Open at least two unpinned tabs to group them.</p>}
    </>
  )
}

function Result({ notice, canUndo, busy, onUndo }: { readonly notice: Notice; readonly canUndo: boolean; readonly busy: Busy; readonly onUndo: () => void }) {
  const Icon = notice.kind === 'error' ? CircleAlert : Check
  return (
    <div role="status" className={`notice ${notice.kind === 'error' ? 'notice-error' : 'notice-success'} result`}>
      <Icon size={15} strokeWidth={2} aria-hidden="true" />
      <span>{notice.text}</span>
      {notice.kind === 'grouped' && canUndo && (
        <button className="result-undo" onClick={onUndo} disabled={busy !== undefined}>Undo</button>
      )}
    </div>
  )
}
