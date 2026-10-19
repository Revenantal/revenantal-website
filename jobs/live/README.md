# Scheduled Live Job

main.ts loads validated shared content and previous live.json, collects independent Steam, GitHub, project-check and Pelican sources, then atomically replaces live.json. The host schedules this one-shot job every ten minutes.

providers.ts projects Steam/GitHub data and calls pelican/provider.ts directly. GitHub navigation and status checks share one request. project-check.ts performs bounded public HEAD requests. pelican/ discovers manually assigned status-bot servers, reads resources and queries optional player counts using one runtime game hostname and each allocation port. No separate agent or SSH transfer exists.

collect.ts preserves each failed source's successful timestamp and reapplies server policy. Private numeric rate baselines live in pelican-state.json, which Caddy never serves. Never write raw responses, keys or player identities to public or private snapshots.

Import shared data types/schemas only. Build with pnpm build:live, preview with pnpm live:preview, and verify the standalone scheduled path with pnpm test:pelican. Hosting remains disconnected until configured separately.
