import type { PermissionPort } from '../../application/ports'
import type { ProviderSettings } from '../../domain/settings'
import { providerOriginPattern } from '../../domain/settings'

export const chromePermission: PermissionPort = {
  contains: (settings) => chrome.permissions.contains({ origins: [providerOriginPattern(settings)] }),
}
export function requestProviderPermission(settings: ProviderSettings): Promise<boolean> {
  return chrome.permissions.request({ origins: [providerOriginPattern(settings)] })
}

export function removeProviderPermission(originPattern: string): Promise<boolean> {
  return chrome.permissions.remove({ origins: [originPattern] })
}

export function revokeProviderPermission(originPattern: string): Promise<void> {
  return chrome.permissions.remove({ origins: [originPattern] }).then(() => {})
}
