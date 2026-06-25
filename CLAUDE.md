# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **`viral-factory`** — a portable Claude Code *plugin*, not a runnable application. Its premise: **Content-Market Fit before Product-Market Fit** — find a viral video format that the algorithm already distributes, then slot a product into it.

The "program" is Claude Code itself. Skills (markdown SOPs in [viral-factory/skills/](viral-factory/skills/)) are step-by-step procedures that Claude executes by calling MCP tools, spawning sub-agents, and running the three TypeScript scripts. The scripts do *not* call Apify/Higgsfield themselves — Claude makes those MCP calls and pipes results into the scripts. Read a `SKILL.md` as the source of truth for how a command behaves.

The plugin under [viral-factory/](viral-factory/) is meant to be installed into a *separate product repository* as a git submodule under `.claude/plugins/viral-factory`. This repo (`content-factory`) is the plugin's development home; it also contains the source PRDs/method docs at the root (`architecture (2).md`, `prd-*.md`, `viral-content-method.md`) and example pipeline outputs under [artifacts/viral-factory/](artifacts/viral-factory/).

## Architecture: the four-stage pipeline

```
/discover-niche → /decompose-video → /spec-from-niche → /recreate-video
  Scrape+Score      Viral mechanics     Product brief       Template swap
```

`/init-from-prd` seeds the config before the pipeline runs. Each skill reads/writes artifacts under `artifacts/viral-factory/` in the *consuming* repo, and all skills read shared context from `viral-factory.config.yaml` at that repo's root.

Key design patterns (see [viral-factory/reference/method.md](viral-factory/reference/method.md)):
- **Deterministic scripts + LLM orchestration split**: `scrape.ts`/`score.ts` are pure data transforms with documented MCP I/O contracts (see the comment blocks in `scrape.ts`); Claude supplies the data. `cluster.ts` is the exception — it calls the Anthropic SDK directly to semantically group pain points (no embedding model).
- **Fan-out workers**: `/discover-niche` launches `video-analyst` and `comment-miner` sub-agents in parallel, one per video (top-10). Each agent returns *only* a JSON object matching a schema in [viral-factory/scripts/schemas/](viral-factory/scripts/schemas/). Their outputs feed `cluster.ts`.
- **Two-pass scoring**: `score.ts` computes `NicheScore` with a default `pain_density` (0.5), then `updatePainDensity()` recomputes after `comment-miner` results arrive.
- **Accumulating format library**: `/decompose-video` *appends* to [viral-factory/reference/video-templates.md](viral-factory/reference/video-templates.md) (never overwrites); `/recreate-video` swaps a product into a proven template.

### NicheScore (the central metric)
```
NicheScore = 0.35×Monetization + 0.25×OutlierScore_norm
           + 0.20×SaveShareRate_norm + 0.10×Velocity_norm + 0.10×PainDensity
```
`_norm` components are min-max normalized **within the current batch**. `OutlierScore = views / author_median_views` isolates format strength from audience size — it is the core signal, not absolute views. Full breakdown and calibration notes in [viral-factory/reference/scoring.md](viral-factory/reference/scoring.md). Evaluate a niche on the **median of the top-10**, not the top-1.

## Running the scripts

There is **no `package.json` or `tsconfig.json`** — scripts run directly via `npx ts-node`. `cluster.ts` imports `@anthropic-ai/sdk`, so that package must be resolvable (and `ANTHROPIC_API_KEY` set) when running it.

```bash
# Score a raw collection
npx ts-node viral-factory/scripts/score.ts \
  --input artifacts/viral-factory/raw/{slug}.json \
  --output artifacts/viral-factory/scored/{slug}.json \
  --shop-data artifacts/viral-factory/raw/{slug}-shop.json

# Cluster pain points (calls Anthropic API)
npx ts-node viral-factory/scripts/cluster.ts \
  --extractions artifacts/viral-factory/extractions/{slug}.json \
  --comments artifacts/viral-factory/comments/{slug}.json \
  --output artifacts/viral-factory/clusters/{slug}.json \
  --n-clusters 8

# scrape.ts prints the Apify/yt-dlp/Whisper orchestration plan; Claude executes the actual calls
npx ts-node viral-factory/scripts/scrape.ts --slug {slug} --keywords "..." --min-views 50000
```

There is no build, lint, or test setup. Path conventions for artifacts are fixed by the skills — match `artifacts/viral-factory/{raw,scored,extractions,comments,clusters,niches,specs,scripts}/{slug}.*`.

## External dependencies

- **Apify MCP** — TikTok scraping (`apify/tiktok-scraper`, `-profile-scraper`, `-comments-scraper`, `-shop-scraper`). Skills degrade gracefully and warn the user when it's absent.
- **Higgsfield MCP** — video generation + `virality_predictor`. Optional; skills skip and note "not scored" when unavailable.
- **`yt-dlp`** + **Whisper** (`faster-whisper`, `--model base`) — download/transcribe videos to `/tmp/viral-factory/`. On per-video failure, skills log and continue rather than abort.
- **Node.js 18+**.

## Conventions when editing

- **Skills, agents, and reference docs are written in Ukrainian; code, schemas, and structured prompts are in English.** Match the surrounding language of the file you edit.
- When changing a skill's behavior, the `SKILL.md` is canonical — also update its `triggers` and `description` in [viral-factory/plugin.json](viral-factory/plugin.json) so they stay in sync.
- The `NicheScore` weights and formula appear in three places that must agree: `score.ts` (`scoreRecords`/`updatePainDensity`), `reference/scoring.md`, and the header comment in `score.ts`. Change all three together.
- Agent outputs are schema-locked. When adding a field, update the JSON schema in `scripts/schemas/`, the inline example in the agent's `.md`, and any consumer (`cluster.ts`) at once.
- Skills follow a fixed shape: **Pre-flight checks → numbered Steps → "Report to user"**. The final step always summarizes in chat and points to the written artifact rather than dumping the full file.
