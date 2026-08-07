import type { RuntimeRequest, RuntimeResponse } from '../application/runtime-messages'

export const runtimeClient = {
  send: (request: RuntimeRequest): Promise<RuntimeResponse> => chrome.runtime.sendMessage(request),
  openOptions: (): Promise<void> => chrome.runtime.openOptionsPage(),
}
