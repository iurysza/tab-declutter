export type ShortcutResult =
  | { readonly kind: 'working' }
  | { readonly kind: 'done'; readonly groupCount: number }
  | { readonly kind: 'failed'; readonly message: string }

const defaultTitle = 'Tab Declutter'
const clearAfterMs = 4000

/**
 * The shortcut runs without the popup, so the toolbar badge is the only feedback.
 * The tooltip carries the full message; the badge is a short glance cue.
 */
export async function showShortcutResult(result: ShortcutResult): Promise<void> {
  const view = result.kind === 'working'
    ? { text: '…', color: '#4f46e5', title: 'Tab Declutter: grouping tabs…' }
    : result.kind === 'done'
      ? { text: result.groupCount ? String(result.groupCount) : '0', color: '#047857', title: result.groupCount ? `Tab Declutter: made ${result.groupCount} group${result.groupCount === 1 ? '' : 's'}` : 'Tab Declutter: no clear groups found' }
      : { text: '!', color: '#b91c1c', title: `Tab Declutter: ${result.message}` }
  await chrome.action.setBadgeBackgroundColor({ color: view.color })
  await chrome.action.setBadgeText({ text: view.text })
  await chrome.action.setTitle({ title: view.title })
  if (result.kind === 'working') return
  setTimeout(() => {
    void chrome.action.setBadgeText({ text: '' })
    void chrome.action.setTitle({ title: defaultTitle })
  }, clearAfterMs)
}
