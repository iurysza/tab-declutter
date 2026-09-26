import { groupTabsCommand } from '../application/commands'
import type { RuntimeRequest, RuntimeResponse } from '../application/runtime-messages'

export const runtimeClient = {
  async send(request: RuntimeRequest): Promise<RuntimeResponse> {
    try { return await chrome.runtime.sendMessage(request) }
    catch { return { ok: false, error: { code: 'apply-failed', message: 'Tab Declutter could not complete the request' } } }
  },
  openOptions: (): Promise<void> => chrome.runtime.openOptionsPage(),
  /** The shortcut the user has assigned, or undefined when none is set. */
  async getShortcut(): Promise<string | undefined> {
    const commands = await chrome.commands.getAll()
    return commands.find((command) => command.name === groupTabsCommand)?.shortcut || undefined
  },
  openShortcutSettings: async (): Promise<void> => { await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }) },
}
