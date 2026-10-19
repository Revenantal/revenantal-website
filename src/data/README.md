# Shared Data

Owns serializable types, Zod boundary schemas, snapshot loaders, freshness filtering and the application store. Imports stay inside this module.

loaders.ts reads site.json and live.json once. decode-live.ts isolates malformed sources. freshness.ts removes old telemetry while retaining navigation and permitted server identities. store.ts owns shared actions, persistence and subscriptions; it accepts clock ticks without polling.

Add new external fields to schemas and types together, then test invalid input and expiry behavior before exposing them to a view. Channels may import types only; backend jobs may import types and schemas, never UI or store code.
