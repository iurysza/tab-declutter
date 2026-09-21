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

## How it works

How-it-works docs live under `ai-artifacts/`. Start at `ai-artifacts/goals/llm-tab-grouping/`. When architecture or behavior changes, update these files.

| File | Contents |
| --- | --- |
| [goal.md](ai-artifacts/goals/llm-tab-grouping/goal.md) | Contract and done-when |
| [intent.md](ai-artifacts/goals/llm-tab-grouping/intent.md) | Outcome, scope, and non-goals |
| [facts.md](ai-artifacts/goals/llm-tab-grouping/facts.md) | Accepted behavior |
| [facts.meta.json](ai-artifacts/goals/llm-tab-grouping/facts.meta.json) | Verification metadata for each fact |
| [plan.md](ai-artifacts/goals/llm-tab-grouping/plan.md) | Design and implementation plan |
| [dev-log.md](ai-artifacts/goals/llm-tab-grouping/dev-log.md) | Development log |

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
