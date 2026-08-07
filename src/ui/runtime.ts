import type { RuntimeRequest, RuntimeResponse } from '../application/runtime-messages'

export const runtimeClient = {
  async send(request: RuntimeRequest): Promise<RuntimeResponse> {
    try { return await chrome.runtime.sendMessage(request) }
    catch { return { ok: false, error: { code: 'apply-failed', message: 'Threadline could not complete the request' } } }
  },
  openOptions: (): Promise<void> => chrome.runtime.openOptionsPage(),
}
