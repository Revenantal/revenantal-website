# Scheduled Live Job

main.ts reads validated site content and the previous snapshot, collects independent sources, then writes live.json by temporary-file rename. It runs once; the host scheduler supplies the ten-minute interval.

providers.ts projects Steam/GitHub responses into public fields. GitHub project navigation and activity share one request per run. project-check.ts performs bounded public HEAD checks with pinned DNS and no redirects. collect.ts preserves each source's original successful time on failure and applies current server publication policy.

Only shared data types/schemas may be imported. Keep credentials in the job environment, errors bounded and raw server/player data out of output. Build with pnpm build:live; run locally with pnpm live:preview. See deploy/ for image and scheduler examples. Pelican collection is a separate unimplemented agent.
