import { aiSdkClassifier } from '../adapters/ai/ai-sdk-classifier'
import { showShortcutResult } from '../adapters/chrome/chrome-badge'
import { chromePermission } from '../adapters/chrome/chrome-permissions'
import { chromeSettings, chromeUndo, restrictLocalStorage } from '../adapters/chrome/chrome-storage'
import { chromeWorkspace } from '../adapters/chrome/chrome-workspace'
import type { AppPorts } from '../application/ports'
import { groupWithSavedLens } from '../application/group-with-saved-lens'
import { groupTabsCommand } from '../application/commands'
import { createDispatch } from './dispatch'

const ports: AppPorts = {
  workspace: chromeWorkspace,
  settings: chromeSettings,
  undo: chromeUndo,
  permission: chromePermission,
  classifier: aiSdkClassifier,
  clock: { now: () => Date.now() },
}
const dispatch = createDispatch(ports)

void restrictLocalStorage()
chrome.runtime.onInstalled.addListener(() => { void restrictLocalStorage() })

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void dispatch(message).then(sendResponse, () => sendResponse({ ok: false, error: { code: 'apply-failed', message: 'Tab Declutter could not complete the request' } }))
  return true
})

chrome.commands.onCommand.addListener((command) => {
  if (command !== groupTabsCommand) return
  void showShortcutResult({ kind: 'working' })
    .then(() => groupWithSavedLens(ports))
    .then(
      (result) => showShortcutResult(result.ok ? { kind: 'done', groupCount: result.value.groupCount } : { kind: 'failed', message: result.error.message }),
      () => showShortcutResult({ kind: 'failed', message: 'Tab Declutter could not complete the request' }),
    )
})
