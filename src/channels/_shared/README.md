# src/channels/_shared

Shared channel props, input capture, save access, media helpers and fixtures belong here. Import serializable data types only.

- `types.ts`: the host interface every channel receives.
- `lineup.ts` and `manifest-check.ts`: registry and manifest validation.
- `testing/`: the channel contract suite, its fixtures and a sample reference channel. Test-only; lint rejects imports from application code.

No channel build is approved without its own plan review.
