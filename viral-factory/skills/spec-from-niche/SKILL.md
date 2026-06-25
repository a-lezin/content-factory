# Skill: spec-from-niche

**Triggers:** "зроби spec", "product spec", "spec from niche", "product brief", "що будувати", "build spec from niche", "what should I build"

**Description:** Converts a validated niche report into a structured product spec. Reads the niche report and pain clusters, then writes `artifacts/viral-factory/specs/{product_slug}.md`.

---

## Pre-flight

Read `viral-factory.config.yaml`. Extract `niche.slug`, `product.name`, `product.slug`, `product.one_demo_feature`, `product.brand_voice`, `audience.*`.

Check that `artifacts/viral-factory/niches/{slug}.md` exists. If it does not — tell the user: "No niche report found. Run /discover-niche first." and stop.

Check that `artifacts/viral-factory/clusters/{slug}.json` exists. If it does not — tell the user clusters are missing and ask if they want to proceed with the niche report only (less precise).

---

## Step 1 — Identify the primary pain

Read the cluster JSON from `artifacts/viral-factory/clusters/{slug}.json`.

Select the cluster with the highest `frequency × commercial_intent_score`. This is the primary pain. If two clusters are within 10% of each other — note both and ask the user to choose (present both as one sentence each in their exact audience language).

State the primary pain in one sentence using verbatim audience language (pull from `representative_phrases` in the cluster). Not marketing language.

---

## Step 2 — Derive the one-demo feature

The one-demo feature is the single capability that, shown in a 30-second video, makes the primary pain disappear on screen.

Requirements for a valid one-demo feature:
- **Visual**: the result is visible on camera
- **Immediate**: no setup or onboarding required in the demo
- **Sticky**: viewer immediately thinks "I need this"

Decision:
- If `product.one_demo_feature` is already set in config → use it. Verify it meets the 3 requirements above. If it doesn't, flag the concern but use it anyway.
- If not set → derive from the primary pain and the most common video format in the niche report. Write 2–3 sentences describing what happens on screen during the demo.

---

## Step 3 — Derive positioning

Write a positioning statement using this template:

> "{product.name} is the {category descriptor} for {audience portrait, 10 words max} who struggle with {primary pain, one clause}. Unlike {implicit alternative}, it {one-demo feature, one verb phrase}."

Keep it under 40 words total.

---

## Step 4 — Derive pricing signal

From the TikTok Shop Signal section of the niche report, note the price of the top-selling products.

Recommendation logic:
- If top Shop product sells at $X/month (subscription) → recommend $X × 0.8 to $X × 1.0, depending on feature parity
- If no Shop data → recommend based on pain severity: high pain (pain_density > 0.4) → willing to pay $15–$30/month; moderate → $7–$15/month
- If freemium + paywall model → recommend free tier with hard paywall at the one-demo feature

Always note the uncertainty if Shop data is absent.

---

## Step 5 — Derive brand voice

If `product.brand_voice` is set in config → use it verbatim.

If not set → synthesize from:
- `slang_and_phrases` from comment-miner outputs
- `audience_portrait` from the niche report
- The top emotions from comment miners

Write 3 sentences: tone, vocabulary, what to avoid.

---

## Step 6 — Select top 5 hooks to test

From the Hook Bank in the niche report and the `ready_hooks` fields in comment-miner outputs, select the 5 hooks most aligned with the one-demo feature.

Ranking criteria (highest score first):
1. Names the primary pain explicitly → +2 points
2. Uses verbatim audience language → +2 points
3. Under 10 words → +1 point
4. Has transformation framing → +1 point

List top 5 with source attribution (from niche report hook bank or comment-miner video URL).

---

## Step 7 — List video formats to replicate

From the niche report's "Recurring Formats" section, list the top 3 formats. For each:
- Format label
- Example URL from the niche report
- Template reference in `reference/video-templates.md` (if decomposed — link the entry; if not, note "run /decompose-video on this URL")

---

## Step 8 — Write the spec

Write `artifacts/viral-factory/specs/{product_slug}.md`:

```markdown
# Product Spec: {product.name}
Generated: {date}
Source niche: {slug}
Niche report: artifacts/viral-factory/niches/{slug}.md

## One-line positioning
{positioning statement}

## Primary pain
{primary pain in audience language — verbatim phrase from clusters}
Cluster: {cluster_name} | Frequency: {n} | Commercial intent score: {score}

## One-demo feature
{description of the demo feature — what happens on screen, what the viewer sees, why it's sticky}

## Pricing signal
{recommended price / model} — {rationale}
TikTok Shop comps: {top product name at $X/mo} | Uncertainty: {low/medium/high}

## Brand voice
{3 sentences: tone, vocabulary, what to avoid}

## Top 5 hooks to test (ranked)
1. "{hook}" — [source: {url or niche report hook bank}]
2. "{hook}" — [source: ...]
3. "{hook}" — [source: ...]
4. "{hook}" — [source: ...]
5. "{hook}" — [source: ...]

## Video formats to replicate
1. {format}: {example URL} | Template: {reference/video-templates.md#anchor or "run /decompose-video"}
2. {format}: {example URL} | Template: ...
3. {format}: {example URL} | Template: ...

## Audience portrait
{from niche report, 1 paragraph. Include slang phrases in quotes.}

## Open questions
{Anything uncertain: pricing model validation needed, legal/App Store considerations, technical feasibility of one-demo feature, competitor moat}

## Recommended next step
Run /recreate-video with hook #1 and the first format template to produce the first draft video.
```

---

## Step 9 — Report to user

Tell the user:
1. The spec file path
2. The one-line positioning statement
3. The primary pain (in audience language)
4. The one-demo feature in one sentence
5. Recommended first hook to test
