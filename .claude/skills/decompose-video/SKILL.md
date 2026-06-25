---
name: decompose-video
description: Decompose one viral video into a reusable format template — hook, structure, novelty element — and append it to viral-factory/reference/video-templates.md. Downloads and transcribes the video, then runs the video-analyst agent. Trigger whenever the user shares a TikTok or Instagram Reels URL and wants to understand or template it — phrases like "decompose video", "розбери відео", "analyze video", "break down video", "template this video", "що робить це відео вірусним".
---

# decompose-video

## Pre-flight

Ask the user for a video URL if they haven't provided one. Accept TikTok (`tiktok.com/@.../video/...`) or Instagram Reels (`instagram.com/reel/...`) URLs.

---

## Step 1 — Download the video

Run via bash tool:
```
yt-dlp -o "/tmp/viral-factory/{video_id}.%(ext)s" --no-playlist --quiet "{url}"
```

Where `{video_id}` is extracted from the URL (the numeric or alphanumeric ID in the TikTok URL, or the Reels short ID).

If yt-dlp fails (geo-block, removed video, private account):
- Tell the user: "Video download failed: {error}. The video may be private, removed, or geo-blocked."
- Offer to proceed with transcript-only analysis if the user can paste the transcript manually
- If no transcript available — stop

---

## Step 2 — Transcribe

Run via bash tool:
```
whisper "/tmp/viral-factory/{video_id}.mp4" --model base --output_format json --word_timestamps True --output_dir "/tmp/viral-factory/"
```

Read the JSON output. Extract the transcript text with timestamps.

If Whisper fails — note it and continue (transcript will be null, visual analysis still possible if file exists).

---

## Step 3 — Get metadata

Fetch view count, likes, shares, saves, author, and `author_median_views` via Apify MCP if not already known:
- Actor: `apify/tiktok-scraper` with the video URL
- Compute OutlierScore = views / author_median_views (if author_median_views available)

---

## Step 4 — Launch video-analyst agent

Launch the `video-analyst` sub-agent with:
- `video_url`: the URL
- `transcript`: the Whisper transcript (or null)
- `video_file_path`: the local download path (or null)

Wait for the result. Verify it matches the schema in `viral-factory/scripts/schemas/extraction.json`. If the JSON is malformed — ask the agent to retry once.

---

## Step 5 — Virality score (optional)

If Higgsfield MCP is available and the video file was downloaded:
1. Upload the video: call `media_upload_widget` or `media_upload` + `media_confirm`
2. Call `virality_predictor` with the uploaded media ID
3. Record the score and any breakdown (hook_score, retention_score, etc.)

If Higgsfield is unavailable or the video couldn't be downloaded — skip this step. Note "not scored" in the template entry.

---

## Step 6 — Build template entry

Synthesize a template entry from the extraction result and metadata:

```markdown
## Template: {format} — {hook_type}
Source: {url}
Added: {date}
OutlierScore: {value or "unknown"}
NicheScore: {value or "unknown"}
Virality score (Higgsfield): {value or "not scored"}
Views: {views}
Author: {author}

**Hook:** {hook}
**Hook type:** {hook_type}

**Structure:**
1. `{beat}` ({timestamp_range if known}) — {one-line description}
2. `{beat}` — {one-line description}
[...continue for all beats]

**Novelty element:** {novelty_element}
**Pacing:** {pacing}
**Sound role:** {sound_role}
**CTA:** {cta or "none"}
**Product in frame:** {product_in_frame or "none"}
**Template replicability:** {template_replicability}

**How to replicate:** {2–3 sentences on what makes this format work and how to apply it to a new product}

**Swap points:**
1. {element 1 that can change without breaking the format}
2. {element 2}
3. {element 3 if applicable}

---
```

---

## Step 7 — Append to catalog

Append the template entry to `viral-factory/reference/video-templates.md`. Do not overwrite or replace existing entries — append after the last `---` divider.

---

## Step 8 — Report to user

Tell the user:
1. "Template added to viral-factory/reference/video-templates.md"
2. The format label and hook type
3. Template replicability score and what it means in plain language
4. The 2 most important swap points in one sentence
5. If virality score was obtained — share it

Do not reproduce the full template entry in chat — just the summary.
