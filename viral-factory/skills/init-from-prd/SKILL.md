# Skill: init-from-prd

**Triggers:** "init from prd", "ініціалізуй з PRD", "читай PRD", "завантаж PRD", "load prd", "read prd", "setup from prd", "налаштуй з документа"

**Description:** Reads a PRD or method document and extracts structured information to populate `viral-factory.config.yaml`. Bridges the gap between a product/business document and the viral-factory discovery pipeline. Run this once before `/discover-niche` to pre-seed the config with niche keywords, audience signals, and product context.

---

## Pre-flight

Ask the user for the PRD file path if they haven't provided one.

Accept any markdown, text, or PDF file. Common locations: `~/Downloads/`, project root, `docs/`.

If the file does not exist — tell the user and stop.

Check whether `viral-factory.config.yaml` exists in the current directory:
- If it exists: tell the user "Config already exists — extracted values will be merged in. Existing fields will be overwritten only if the PRD provides a clearer value."
- If it does not exist: tell the user "No config found — will create a new one from scratch."

---

## Step 1 — Read the document

Read the full content of the PRD file.

Identify the document type from its content:
- **Method/theory doc** — explains a framework, principles, benchmarks, case studies (like `viral-content-method.md`). Signals: sections like "principles", "how it works", "benchmarks", case banks.
- **Product PRD** — describes a specific product, its audience, features, and goals. Signals: sections like "problem", "solution", "user stories", "feature list", "target audience".
- **Hybrid** — contains both method theory and product specifics.

State the identified type to the user before continuing.

---

## Step 2 — Extract niche context

From the document, extract:

**Keywords** — search terms that would surface relevant TikTok content:
- Pull from: problem descriptions, pain points, product category mentions, audience language, competitor names
- Target: 5–10 keyword phrases in the language the audience actually searches in (usually colloquial, not marketing-speak)
- Example signal: "ADHD/focus" in a document about focus supplements → keywords: "can't focus", "ADHD tips", "brain fog fix", "how to focus with ADHD"

**Competitor accounts** — TikTok/Instagram accounts to monitor:
- Pull from: competitor mentions, case studies, "similar to X" references
- If the document names specific apps or brands, search their TikTok presence (list them as `@handle` — leave as `@{brand-name}` if handle unknown, user will verify)

**TikTok Shop queries** — product category terms for Shop discovery:
- Pull from: product category, physical product analogues for the pain (supplements, tools, books), adjacent categories mentioned in case studies
- Example: focus app PRD → Shop queries: "focus supplement", "ADHD journal", "productivity planner"

**Niche slug** — a short kebab-case identifier for the niche:
- Derive from the product category or primary pain
- Example: "adhd-focus", "dating-app", "fitness-tracker"

---

## Step 3 — Extract product context

From the document, extract:

**Product name** — the name of the product being built. If not stated, use "TBD".

**One-demo feature** — the single capability that, shown in 30 seconds on camera, makes the primary pain disappear:
- Look for: "key feature", "core value prop", "the thing that makes it different", demo descriptions, screenshots mentioned
- Rewrite in camera terms: what does the viewer actually *see* on screen?
- If the document describes multiple features, select the most visually demonstrable one
- If unclear, write a placeholder and flag it: `# TODO: define one-demo feature — what happens on screen?`

**Brand voice** — tone, vocabulary, what to avoid:
- Pull from: how the document itself is written (mirrors intended audience), explicit tone guidance, target audience description
- Write 3 sentences: tone, vocabulary, what to avoid
- If not enough signal: `# TODO: define brand voice`

**Screen record path** — leave as `assets/{product-slug}-demo.mp4` (placeholder)

---

## Step 4 — Extract audience portrait

From the document, extract:

**Portrait** — who the buyer is: demographics, context, emotional state, what they've already tried, why they're desperate:
- Pull from: "target audience", "user persona", problem descriptions, case study customer descriptions
- Write 3–5 sentences in plain language, not marketing copy

**Slang and phrases** — language the audience actually uses:
- Pull from: verbatim quotes in case studies, comment examples, pain descriptions written in audience voice
- If the document has a case bank or comments section — extract literal phrases
- Target 5–10 phrases
- If few signals: `# TODO: enrich slang after /discover-niche runs comment-miner`

---

## Step 5 — Extract benchmarks (if method doc)

If the document is a method or theory doc (not a pure product PRD), also extract:

**Benchmarks table** — any numeric thresholds mentioned (min views, outlier multipliers, conversion rates):
- Pull from: tables, benchmark sections, "if X then Y" rules
- Map to config thresholds: `min_views`, `min_comments`, `min_outlier`
- If the doc specifies a different threshold (e.g., "1k comments for analysis") — use it; otherwise keep defaults (50k views, 1k comments, 10× outlier)

**Case bank signal** — if the doc names successful products with revenue figures:
- List them briefly as a comment in the config under `# Case bank from PRD:`
- These inform the NicheScore Monetization tier expectations

---

## Step 6 — Write or update config

Construct the complete `viral-factory.config.yaml` content:

```yaml
# viral-factory.config.yaml
# Generated by /init-from-prd from: {prd_filename}
# Date: {date}
# Review all TODO comments before running /discover-niche

niche:
  slug: {derived slug}
  keywords:
    {list of extracted keyword phrases, one per line with - prefix}
  accounts:
    {list of @handles, or placeholder @{brand-name} with comment}
  shop_queries:
    {list of Shop search queries}

thresholds:
  min_views: {extracted or default 50000}
  min_comments: {extracted or default 1000}
  min_outlier: {extracted or default 10}

product:
  name: {product name or "TBD"}
  slug: {product slug}
  one_demo_feature: >
    {extracted or TODO placeholder}
  brand_voice: >
    {extracted or TODO placeholder}
  screen_record_path: "assets/{product-slug}-demo.mp4"

audience:
  portrait: >
    {extracted portrait}
  slang:
    {list of phrases, or TODO if not enough signal}

# --- Case bank from PRD (informational) ---
# {case study product}: {revenue figure} — {mechanism, one line}
# ...
```

If the config already exists — read it first, then merge:
- For each field: if PRD provides a non-empty value, overwrite; if PRD has no signal for a field, keep the existing value
- Preserve any user-edited comments or custom fields not in the template

Write the final config to `viral-factory.config.yaml`.

---

## Step 7 — Identify gaps

After writing the config, scan it for:
- Fields still set to "TBD" or containing `# TODO`
- `accounts` list with unverified `@{brand-name}` placeholders
- `slang` list with fewer than 5 entries
- `one_demo_feature` that doesn't describe on-screen action

List each gap to the user with a one-line suggestion for how to fill it:

| Field | Gap | How to fill |
|---|---|---|
| `product.one_demo_feature` | Not found in PRD | Describe what happens on screen in 2 sentences — what does the viewer see and feel? |
| `niche.accounts` | Placeholders only | Search TikTok for `{top keyword}` and note the top 3–5 creator handles |
| `audience.slang` | Only 3 phrases | Run `/discover-niche` — comment-miner will expand this automatically |

---

## Step 8 — Report to user

Tell the user:
1. Config written to `viral-factory.config.yaml`
2. Niche slug and number of keywords extracted
3. Number of gaps remaining (with the gap table from Step 7)
4. Recommended next step:
   - If gaps are critical (no product name, no keywords): "Fill the TODOs above before running /discover-niche"
   - If gaps are minor (slang, accounts): "Config is ready — run `/discover-niche` to start the pipeline. Comment-miner will fill slang gaps automatically."

Do not reproduce the full config in chat — just the summary and gap table.
