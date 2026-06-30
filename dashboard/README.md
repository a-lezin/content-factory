# Viral Factory Dashboard

Dense analyst UI for the viral-factory pipeline. Reads scored artifacts directly from the repo filesystem — no separate DB required.

## Local dev

```bash
cd dashboard
npm install
npm run dev      # http://localhost:3000
```

Reads artifacts from `../artifacts/viral-factory/` relative to the dashboard folder.

## Vercel deploy

1. Import the **workshop** repo in Vercel.
2. Set **Root Directory** → `dashboard`.
3. Framework preset: Next.js (auto-detected).
4. No env vars required — artifacts are read at build time from the repo.
5. Deploy. After each `/discover-niche` run, push the new JSON artifact and trigger a redeploy (or enable auto-deploys from main).

## What's shown

| Feature | Status |
|---------|--------|
| Niche list with NicheScore | ✓ |
| Niche detail: KPI row + component mini-bars | ✓ |
| Video table with inline score bars | ✓ |
| Score breakdown grouped bar chart | ✓ |
| Views × OutlierScore scatter (log scale) | ✓ |
| Niche report (markdown render) | ✓ |
| Multi-project sidebar | ✓ |

## Artifact dependencies

The dashboard reads these files (produced by `/discover-niche`):

```
artifacts/viral-factory/{project}/scored/{slug}.json   ← video table + charts
artifacts/viral-factory/{project}/niches/{slug}.md     ← report tab
```

A niche with only a `.md` (no scored JSON) shows the report tab only with an "no data" state for the other tabs.

## E2 backlog (not yet built)

- Creator Leaderboard tab (from niche report parser)
- Heatmap / treemap of pain clusters (needs `clusters/{slug}.json`)
- Velocity timeline
- Multi-project niche compare

## E3 — Trigger pipeline from UI

Requires a bridge between the UI and the Claude Code environment running the MCP/Apify calls. Options:
1. **GitHub Actions webhook** — UI POSTs to a GH Actions workflow dispatch; Actions runs `/discover-niche` via Claude Code CLI.
2. **Modal / Fly.io worker** — dedicated container with Claude Code + Apify keys; UI hits a `/run` endpoint.
3. **Local tunnel (dev only)** — `ngrok` + local Claude Code server.

Recommended: option 1 (GitHub Actions) for simplicity. Implement in E3 after E2 charts are done.
