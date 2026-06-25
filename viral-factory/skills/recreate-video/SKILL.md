# Skill: recreate-video

**Triggers:** "recreate video", "згенеруй відео", "make video", "produce video", "create video", "generate video", "film video", "відтвори відео"

**Description:** Takes a product spec and a proven video template, generates a script, produces a video via Higgsfield, and scores it with virality_predictor. Implements the "template swap" principle: format is proven, product is the variable.

---

## Pre-flight

Read `viral-factory.config.yaml`. Extract `product.*` and `audience.*`.

Ask the user (if not specified):
1. Which hook number to use? (from the product spec — "run /spec-from-niche first if no spec exists")
2. Which format template? (from `reference/video-templates.md` — list available templates by name)

Defaults if user doesn't answer:
- Hook: #1 from the spec
- Template: first entry in `reference/video-templates.md` that matches the niche

Check that `artifacts/viral-factory/specs/{product_slug}.md` exists. If not — tell the user to run `/spec-from-niche` first and stop.

---

## Step 1 — Load inputs

Read:
- Product spec: `artifacts/viral-factory/specs/{product_slug}.md`
- Chosen template: the matching entry from `reference/video-templates.md`
- Config: `product.one_demo_feature`, `product.brand_voice`, `audience.slang`, `audience.portrait`

Identify the template's swap points (from the template entry). These are the only elements you change.

---

## Step 2 — Write the script

Using the template structure, perform a template swap:

**Fixed (keep from template):**
- Number and order of structural beats
- Beat names and their functions
- Pacing rhythm
- CTA pattern (keep the structure, change the product)

**Swapped (change to this product):**
1. **Hook**: use the chosen hook verbatim as the opening line
2. **Product references**: replace with `product.name` and `product.one_demo_feature`
3. **Audience language**: use phrases from `audience.slang` throughout
4. **CTA**: end with a CTA matching the template pattern but naming this product

**Script format:**
Write in shot format (one line per shot/moment), not as a paragraph. Include timing cues. Target 15–30 seconds total.

Example structure:
```
[0–3s] HOOK: "{chosen hook verbatim}"
[3–8s] AGITATION: {show or describe the worst moment of the pain — use audience slang}
[8–15s] PRODUCT REVEAL: {product.name} on screen. Show {one_demo_feature} happening.
[15–22s] DEMONSTRATION: Close-up of {one specific UI element or result}. No voiceover — let the action speak.
[22–26s] SOCIAL PROOF: Text overlay: "{one real result or metric}"
[26–30s] CTA: "{CTA from template, adapted to product.name}"
```

Write the full script to `artifacts/viral-factory/scripts/{product_slug}-hook{n}.md`.

---

## Step 3 — Pre-flight virality score

If Higgsfield MCP is available:
1. Call `virality_predictor` with the script text (as video description/prompt)
2. Report the score to the user before generating
3. If score is below 0.4: warn the user and suggest trying hook #2 before spending credits on generation
4. If score is 0.4+: proceed to generation

If Higgsfield is unavailable — skip scoring and proceed.

---

## Step 4 — Prepare media

If `product.screen_record_path` is set and the file exists:
1. Upload the screen recording:
   - If the user is in a UI-capable client: call `media_upload_widget`
   - Otherwise: call `media_upload` with the filename, PUT bytes to the `upload_url`, then call `media_confirm` with `type: 'file'`
2. Note the `media_id` for use in generation

If screen_record_path is not set or file doesn't exist:
- Tell the user: "No demo recording found at {path}. Generation will use text-to-video without a product reference. Results will be generic."
- Ask: "Do you want to proceed without the recording, or pause to add one?"

---

## Step 5 — Generate video

If Higgsfield MCP is available and media is uploaded (or text-to-video is acceptable):

Call `generate_video` with:
- The script as the generation prompt
- The media_id (if screen recording was uploaded)
- Pacing from the template: fast-cut → short duration per scene; medium → standard
- Sound from the template's `sound_role`:
  - `original-voiceover` → include voiceover instruction in prompt
  - `trending-audio` → note this in prompt, user will add audio in post
  - `silent-text` → no audio instruction

Poll `job_status` with the job ID. Retry up to 12 times with 15-second waits between checks. If job does not complete after 3 minutes — tell the user it may be processing and provide the job ID to check manually.

When complete, call `job_display` to get the result URL.

---

## Step 6 — Post-generation virality score

If a video was generated and Higgsfield is available:
1. Upload the generated video
2. Call `virality_predictor` on the actual video (not just the script)
3. Report the score

---

## Step 7 — Generate hook variations (optional)

If the user asks for variations or if the virality score was below 0.5:

Use hooks #2 and #3 from the spec. For each:
- Repeat Steps 2–3 only (write script variation, get pre-flight score)
- Ask the user: "Hook #2 scores {X} vs Hook #1's {Y}. Generate that one instead?"

Do not auto-generate multiple videos without user confirmation — generation costs credits.

---

## Step 8 — Report to user

Tell the user:
1. Script location: `artifacts/viral-factory/scripts/{product_slug}-hook{n}.md`
2. Video URL (if generated)
3. Virality scores: pre-flight (script) and post-generation (video) if both obtained
4. The single highest-leverage change to improve performance:
   - If hook score was low: "Try hook #2 — it names the pain more directly"
   - If video structure looked weak: "The product reveal comes too late — move it to the 5-second mark"
   - If sound_role was trending-audio: "Add a trending sound in post before publishing"
5. Sprint reminder: "Publish this as part of a batch of 10. Evaluate on the sprint median, not this single video."
