import { defineManifest } from '@crxjs/vite-plugin'
import { groupTabsCommand } from './src/application/commands.ts'

export default defineManifest({
  manifest_version: 3,
  name: 'Tab Declutter',
  description: 'AI tab groups for Chrome, with your own API key. Pick a lens, group in one click, undo in one click.',
  version: '0.1.1',
  minimum_chrome_version: '140',
  permissions: ['tabs', 'tabGroups', 'storage'],
  optional_host_permissions: ['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*', 'http://[::1]/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Tab Declutter',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
    },
  },
  commands: {
    [groupTabsCommand]: {
      suggested_key: { default: 'Alt+Shift+G' },
      description: 'Group tabs with your last-used lens',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
})
