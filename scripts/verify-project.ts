import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8')) as Record<string, unknown>
assert(manifest.manifest_version === 3, 'manifest_version must be 3')
assert(JSON.stringify(manifest.permissions) === JSON.stringify(['tabs', 'tabGroups', 'storage']), 'unexpected required permissions')
assert(JSON.stringify(manifest.optional_host_permissions) === JSON.stringify(['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*']), 'unexpected optional hosts')
assert(!('content_scripts' in manifest), 'content scripts are outside the privacy contract')
const background = manifest.background as Record<string, unknown>
assert(background.type === 'module', 'service worker must be a module')
const readme = readFileSync('README.md', 'utf8')
for (const phrase of ['bun run check', 'chrome://extensions', 'chrome.storage.local', 'OpenAI-compatible', 'no account, backend, analytics, or telemetry']) {
  assert(readme.includes(phrase), `README missing: ${phrase}`)
}
function sourceFiles(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name)
    return statSync(child).isDirectory() ? sourceFiles(child) : [child]
  })
}
const source = sourceFiles('src').filter((file) => /\.(ts|tsx)$/.test(file)).map((file) => readFileSync(file, 'utf8')).join('\n')
assert(!/console\.(log|debug|info|warn|error)/.test(source), 'source must not log provider or tab data')
assert(!/sk-[A-Za-z0-9]{16,}|AIza[A-Za-z0-9_-]{16,}/.test(source), 'tracked source resembles a real provider key')
console.log('project contract verified')
