# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **`viral-factory`** — a portable Claude Code *plugin*, not a runnable application. Its premise: **Content-Market Fit before Product-Market Fit** — find a viral video format that the algorithm already distributes, then slot a product into it.

The "program" is Claude Code itself. Skills (markdown SOPs in [viral-factory/skills/](viral-factory/skills/)) are step-by-step procedures that Claude executes by calling MCP tools, spawning sub-agents, and running the three Python scripts. The scripts do *not* call Apify/Higgsfield themselves — Claude makes those MCP calls and pipes results into the scripts. Read a `SKILL.md` as the source of truth for how a command behaves.

The plugin under [viral-factory/](viral-factory/) is meant to be installed into a *separate product repository* as a git submodule under `.claude/plugins/viral-factory`. This repo (`content-factory`) is the plugin's development home; it also contains the source PRDs/method docs under [docs/](docs/) (`docs/architecture.md`, `docs/prd-*.md`, `docs/viral-content-method.md`) and example pipeline outputs under [artifacts/viral-factory/](artifacts/viral-factory/).

## Architecture: the four-stage pipeline

```
/discover-niche → /decompose-video → /spec-from-niche → /recreate-video
  Scrape+Score      Viral mechanics     Product brief       Template swap
```

`/init-from-prd` seeds the config before the pipeline runs. Each skill reads/writes artifacts scoped to the active project — see **Multi-project structure** below.

Key design patterns (see [viral-factory/reference/method.md](viral-factory/reference/method.md)):
- **Deterministic scripts + LLM orchestration split**: `scrape.py`/`score.py`/`cluster.py` are pure data transforms with no LLM dependency; Claude (the orchestrator) supplies the data and makes all model calls. `cluster.py` prepares `PainItem[]` from extractions + comments; the `pain-clusterer` agent does the actual semantic grouping.
- **Fan-out workers**: `/discover-niche` launches `video-analyst` and `comment-miner` sub-agents in parallel, one per video (top-10). Each agent returns *only* a JSON object matching a schema in [viral-factory/scripts/schemas/](viral-factory/scripts/schemas/). Their outputs feed `cluster.py`, then the `pain-clusterer` agent.
- **Two-pass scoring**: `score.py` computes `NicheScore` with a default `pain_density` (0.5), then `update_pain_density()` recomputes after `comment-miner` results arrive.
- **Accumulating format library**: `/decompose-video` *appends* to `projects/{active_project}/video-templates.md` (never overwrites); `/recreate-video` swaps a product into a proven template.

## Multi-project structure

Multiple products/niches live in parallel without conflicting configs or artifacts:

```
viral-factory.config.yaml          # only: active_project: <slug>
projects/
  pr-pros-ua/
    config.yaml                    # full niche + product + audience config
    video-templates.md             # format library for this project
  ai-accountant/
    config.yaml
    video-templates.md
artifacts/viral-factory/
  pr-pros-ua/
    raw/{slug}.json
    scored/{slug}.json
    extractions/{slug}.json
    comments/{slug}.json
    clusters/{slug}.json
    niches/{slug}.md
    specs/{product_slug}.md
    scripts/{product_slug}-hook{n}.md
  ai-accountant/
    raw/...
```

**To switch the active project**: edit `viral-factory.config.yaml` → change `active_project: <slug>`. All skills read this file first and route all paths accordingly.

**To add a new project**: run `/init-from-prd` with the new PRD — it creates `projects/{slug}/config.yaml` and sets `active_project`.

### NicheScore (the central metric)
```
NicheScore = 0.35×Monetization + 0.25×OutlierScore_norm
           + 0.20×SaveShareRate_norm + 0.10×Velocity_norm + 0.10×PainDensity
```
`_norm` components are min-max normalized **within the current batch**. `OutlierScore = views / author_median_views` isolates format strength from audience size — it is the core signal, not absolute views. Full breakdown and calibration notes in [viral-factory/reference/scoring.md](viral-factory/reference/scoring.md). Evaluate a niche on the **median of the top-10**, not the top-1.

## Running the scripts

Scripts run directly via `python` — no build or install step required. No external API keys are required; all LLM calls go through Claude Code.

```bash
# Score a raw collection (replace {project} with active_project value)
python viral-factory/scripts/score.py \
  --input artifacts/viral-factory/{project}/raw/{slug}.json \
  --output artifacts/viral-factory/{project}/scored/{slug}.json \
  --shop-data artifacts/viral-factory/{project}/raw/{slug}-shop.json

# Prepare pain items for clustering (pure data transform — no LLM)
# Writes {slug}.json.items.json; the pain-clusterer agent does the actual grouping
python viral-factory/scripts/cluster.py \
  --extractions artifacts/viral-factory/{project}/extractions/{slug}.json \
  --comments artifacts/viral-factory/{project}/comments/{slug}.json \
  --output artifacts/viral-factory/{project}/clusters/{slug}.json

# scrape.py prints the Apify/yt-dlp/Whisper orchestration plan; Claude executes the actual calls
python viral-factory/scripts/scrape.py --slug {slug} --keywords "..." --min-views 50000
```

There is no build, lint, or test setup. Path conventions for artifacts are fixed by the skills — match `artifacts/viral-factory/{project}/{raw,scored,extractions,comments,clusters,niches,specs,scripts}/{slug}.*` where `{project}` = `active_project` from `viral-factory.config.yaml`.

## External dependencies

- **Apify MCP** — TikTok scraping (`apify/tiktok-scraper`, `-profile-scraper`, `-comments-scraper`, `-shop-scraper`). Skills degrade gracefully and warn the user when it's absent.
- **Higgsfield MCP** — video generation + `virality_predictor`. Optional; skills skip and note "not scored" when unavailable.
- **`yt-dlp`** + **Whisper** (`faster-whisper`, `--model base`) — download/transcribe videos to `/tmp/viral-factory/`. On per-video failure, skills log and continue rather than abort.
- **Python 3.10+** (uses `datetime.fromisoformat` and `list[...]` type hints).

## Conventions when editing

- **Skills, agents, and reference docs are written in Ukrainian; code, schemas, and structured prompts are in English.** Match the surrounding language of the file you edit.
- When changing a skill's behavior, the `SKILL.md` is canonical — also update its `triggers` and `description` in [viral-factory/plugin.json](viral-factory/plugin.json) so they stay in sync.
- The `NicheScore` weights and formula appear in three places that must agree: `score.py` (`score_records`/`update_pain_density`), `reference/scoring.md`, and the header comment in `score.py`. Change all three together.
- Agent outputs are schema-locked. When adding a field, update the JSON schema in `scripts/schemas/`, the inline example in the agent's `.md`, and any consumer (`cluster.py`) at once.
- Skills follow a fixed shape: **Pre-flight checks → numbered Steps → "Report to user"**. The final step always summarizes in chat and points to the written artifact rather than dumping the full file.
