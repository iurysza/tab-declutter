# AGENTS.md

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

## Git commits
Never include Cursor (or any Cursor agent/bot) as git author, committer, or in a Co-authored-by / similar trailer.
