import { aiSdkClassifier } from '../adapters/ai/ai-sdk-classifier'
import { chromePermission } from '../adapters/chrome/chrome-permissions'
import { chromeSettings, chromeUndo, restrictLocalStorage } from '../adapters/chrome/chrome-storage'
import { chromeWorkspace } from '../adapters/chrome/chrome-workspace'
import { createDispatch } from './dispatch'

const dispatch = createDispatch({
  workspace: chromeWorkspace,
  settings: chromeSettings,
  undo: chromeUndo,
  permission: chromePermission,
  classifier: aiSdkClassifier,
})

void restrictLocalStorage()
chrome.runtime.onInstalled.addListener(() => { void restrictLocalStorage() })
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void dispatch(message).then(sendResponse, () => sendResponse({ ok: false, error: { code: 'apply-failed', message: 'Tab Declutter could not complete the request' } }))
  return true
})
