# Skill: discover-niche

**Triggers:** "знайди нішу", "discover niche", "find niche", "що залітає в {вертикаль}", "analyze niche", "validate niche", "яка ніша"

**Description:** Runs the full Content-Market Fit pipeline for a niche defined in `viral-factory.config.yaml`. Outputs a niche report at `artifacts/viral-factory/niches/{slug}.md`.

**Pipeline:** scrape → score → fan-out analysis → cluster pain → TikTok Shop signal → write report

---

## Pre-flight checks

Before starting, verify:
1. `viral-factory.config.yaml` exists in the repo root. If not, tell the user to create it from the template in the plugin's `viral-factory.config.yaml` and stop.
2. Apify MCP is connected. If not, tell the user to add it in settings and stop.
3. Read the config: extract `niche.slug`, `niche.keywords`, `niche.accounts`, `niche.shop_queries`, and all `thresholds.*`.

---

## Step 1 — Scrape TikTok content

Run `npx ts-node scripts/scrape.ts` to print the Apify call instructions, then:

**1a. Keyword scrape** — call Apify MCP:
- Actor: `apify/tiktok-scraper`
- Input: `{ searchQueries: niche.keywords, maxItems: 200, resultsType: "posts" }`
- Map results to `CollectionRecord[]` using `mapApifyResponseToCollection()` from `scripts/scrape.ts`

**1b. Account scrape** — if `niche.accounts` is non-empty, call Apify MCP:
- Actor: `apify/tiktok-profile-scraper`
- Input: `{ profiles: niche.accounts, maxItems: 30 }`
- Map results to `CollectionRecord[]`

**1c. Author median views** — for each unique author handle in all collected videos:
- Call Apify MCP: `{ profiles: [handle], maxItems: 20 }`
- Compute median of `playCount` from results
- Attach as `author_median_views` to all records for that author

**1d. Filter by views** — keep only records where `views >= thresholds.min_views`

**1e. Comments** — for each video where `comments_count >= thresholds.min_comments`, call Apify MCP:
- Actor: `apify/tiktok-comments-scraper`
- Input: `{ postUrls: [url], maxItems: 500 }`
- Attach result as `comments[]` on the record

**1f. Download + transcribe top-50** — for top 50 videos by views:
- Run: `yt-dlp -o "/tmp/viral-factory/{video_id}.%(ext)s" "{url}"`
- Run: `whisper "/tmp/viral-factory/{video_id}.mp4" --model base --output_format json --word_timestamps True`
- Attach transcript text as `transcript` on the record
- If yt-dlp or whisper fails for a video — log the failure and continue (don't stop)

**1g. TikTok Shop** — if `niche.shop_queries` is non-empty, call Apify MCP for each query:
- Actor: `apify/tiktok-shop-scraper`
- Input: `{ searchQuery: query, maxItems: 20 }`
- Map to `TikTokShopProduct[]`

**1h. Write raw output:**
- `artifacts/viral-factory/raw/{slug}.json` — array of CollectionRecord
- `artifacts/viral-factory/raw/{slug}-shop.json` — array of TikTokShopProduct

Verify the output file exists and contains at least 10 video records. If fewer — warn the user that the niche may have thin coverage and ask whether to continue.

---

## Step 2 — Score

Run:
```
npx ts-node scripts/score.ts \
  --input artifacts/viral-factory/raw/{slug}.json \
  --output artifacts/viral-factory/scored/{slug}.json \
  --shop-data artifacts/viral-factory/raw/{slug}-shop.json
```

Read the scored output. Select the **top 10 videos** by `niche_score`. If fewer than 10 videos passed the view filter, use all available.

Check the outlier threshold: if fewer than 3 of the top-10 have `outlier_score >= thresholds.min_outlier`, warn the user: "Niche signal is weak — fewer than 3 videos show strong format outliers. Consider broadening keywords or changing niche."

---

## Step 3 — Fan-out video-analyst

For each of the top-10 videos, launch a `video-analyst` sub-agent in parallel. Pass:
- `video_url`: the URL
- `transcript`: from the scored record
- `video_file_path`: from the scored record (may be null)

Wait for all agents to complete. Collect all extraction results.

Save all extractions to `artifacts/viral-factory/extractions/{slug}.json` (array of ExtractionRecord).

If fewer than 6 of 10 agents return valid JSON — report which URLs failed and ask user if they want to re-run those.

---

## Step 4 — Fan-out comment-miner

For each of the top-10 videos that has `comments` populated (array is non-null and non-empty), launch a `comment-miner` sub-agent in parallel. Pass:
- `video_url`: the URL
- `comments`: the comments array from the scored record

Wait for all agents to complete. Collect all results.

Save all comment extractions to `artifacts/viral-factory/comments/{slug}.json` (array of CommentMinerRecord).

Build a `painDensityMap: Record<video_id, pain_density_score>` from results.

---

## Step 5 — Update scores with PainDensity

Re-run score update inline (or call `updatePainDensity()` from `scripts/score.ts`) with the pain density map. Re-sort the top-10 by updated niche_score.

---

## Step 6 — Cluster pain points

Run:
```
npx ts-node scripts/cluster.ts \
  --extractions artifacts/viral-factory/extractions/{slug}.json \
  --comments artifacts/viral-factory/comments/{slug}.json \
  --output artifacts/viral-factory/clusters/{slug}.json \
  --n-clusters 8
```

Read the cluster output. Identify the **top 5 clusters** by `frequency × commercial_intent_score`.

---

## Step 7 — Write the niche report

Write `artifacts/viral-factory/niches/{slug}.md` with this exact structure:

```markdown
# Niche Report: {slug}
Generated: {date}
Config: viral-factory.config.yaml → niche.slug = {slug}

## Verdict
[One paragraph: is this niche worth building in? State the single strongest signal.
Lead with the outlier/Shop number. Be direct — either "strong signal" or "weak signal".]

## Top Videos (by NicheScore)
| Rank | URL | NicheScore | OutlierScore | Views |
|---|---|---|---|---|
[Table rows for top-10 videos]

## Recurring Formats
[List the 3–5 most common video formats across the top-10, with example URLs.
Use format labels from video-analyst extractions: product-demo, before-after, etc.]

## Pain Clusters (Top 5)
[For each cluster: name, frequency, commercial_intent_score, 3 verbatim phrases, source video URLs]

## TikTok Shop Signal
[If available: top 3 products, monthly revenue, price, data source.
If unavailable: state "No Shop data collected — Monetization score defaulted to 0.3"]

## Audience Portrait
[Synthesized from comment-miner outputs. Who they are, what they struggle with, their language.
Include 5+ slang phrases verbatim.]

## Hook Bank
[10 ready-to-test hooks. Mix of: derived from comments (cite source), from video openings, synthesized.
Format: 1. "hook text" — [source: comment / video URL]]

## Recommended Next Step
[One of:
- "Run /decompose-video on these URLs to build format templates, then /spec-from-niche"
- "Niche signal is weak — see Concerns below before proceeding"]

## Concerns
[Any red flags: low outlier scores, thin comment data, no Shop signal, overlapping with heavily-funded competitors, legal/ToS issues with the niche]
```

---

## Step 8 — Report to user

After writing the file, tell the user:
1. The file path
2. The verdict in 2 sentences (strong or weak, why)
3. The single strongest signal (top OutlierScore or top Shop revenue)
4. Recommended next step

Do not reproduce the full report in chat — just the summary. The full report is in the file.
