# AGENTS.md

Tab Declutter is a Chrome extension that groups tabs via an LLM into named groups.

## Engineering direction

- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Do not preserve backward compatibility.
- Choose the simplest implementation that fully meets the current requirements.
- Prefer established, well-maintained libraries over custom implementations.

## Project constraints

- Build the Chrome extension with Bun, Vite, React, and TypeScript.
- Keep classification and planning in a functional core; keep Chrome, storage, and network effects in an imperative shell.
- Make core behavior testable without Chrome.
- Keep the user interface minimal, clear, and intentional.
- Never log, expose, or commit API keys.
- Use American English spelling in code, UI copy, and docs.

## How it works

Read [ai-artifacts/architecture/README.md](ai-artifacts/architecture/README.md) before changing layers, flows, or what is sent to the provider. It covers the layer map, the group, undo, and shortcut flows with failure paths, and the privacy boundary. When architecture or behavior changes, update it.

- Any new data sent to the provider must also update `docs/privacy.md`, the Options privacy note, and the store data disclosure in `docs/chrome-web-store.md`.
- Regenerate icons and store images with `store-assets/generate.sh`. Never edit the PNGs by hand.

## Commands

The `packageManager` field in `package.json` is `bun@1.1.34`.

| Command | Runs |
| --- | --- |
| `bun install` | Installs dependencies |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `oxlint src manifest.config.ts vite.config.ts --deny-warnings` |
| `bun run test` | `vitest run` |
| `bun run build` | `vite build` |
| `bun run verify:project` | `scripts/verify-project.ts` |
| `bun run check` | typecheck, lint, test, build, then `verify:project` |
| `bun run dev` | `vite`, for local extension work |

`bun test` runs Bun's own runner. These tests import Vitest, so run `bun run test`.

## Git commits

Never include Cursor (or any Cursor agent/bot) as git author, committer, or in a Co-authored-by / similar trailer.
