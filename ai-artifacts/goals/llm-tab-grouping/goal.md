# Goal

Build Threadline as a polished, client-only Chrome extension that uses the user’s chosen LLM to group the active window by workstream, topic, intent, or a custom criterion, then restores the prior arrangement with one-action Undo.

## Contract

- [Intent](./intent.md)
- [Facts](./facts.md)
- [Fact metadata](./facts.meta.json)
- [Plan](./plan.md)
- [Dev log](./dev-log.md)
- [Architecture decision](../../../docs/decisions/ADR-0001-use-ai-sdk-in-service-worker.md)

## Done when

All accepted facts are implemented; `bun run check` and build/manifest inspections pass; the unpacked extension completes a real group-and-undo smoke against a local OpenAI-compatible fixture; privacy, permissions, provider errors, and partial-mutation recovery are verified; and the dev log contains the evidence.
