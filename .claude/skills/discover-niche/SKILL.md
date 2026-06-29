---
name: discover-niche
description: Run the full Content-Market Fit pipeline for a niche defined in projects/{active_project}/config.yaml — seed expansion, scrape TikTok (EN+UA) + Instagram Reels, batch author-median, wave-2 harvest, score, fan-out video/comment analysis, cluster pain points, and write a niche report with Creator Leaderboard at artifacts/viral-factory/{active_project}/niches/{slug}.md. Trigger whenever the user wants to find, validate, or analyze a viral niche — phrases like "discover niche", "find niche", "знайди нішу", "що залітає", "analyze niche", "validate niche", "яка ніша", or any request to figure out what content is going viral in a vertical.
---

# discover-niche

**Pipeline:** seed-expansion → scrape (TikTok EN + TikTok UA + Instagram Reels) → batch author-median → score wave-1 → wave-2 harvest → final score → dedup/cap → fan-out analysis (top-15) → two-pass PainDensity → cluster pain → write report з Creator Leaderboard

---

## Pre-flight checks

1. `viral-factory.config.yaml` існує в корені репо. Прочитати, отримати `active_project`.
2. `projects/{active_project}/config.yaml` існує. Якщо ні — сказати користувачу створити і зупинитись.
3. Apify MCP підключений. Якщо ні — сказати користувачу додати в settings і зупинитись.
4. Прочитати per-project config: `niche.slug`, `niche.keywords`, `niche.accounts`, `thresholds.*`.

Далі: `{project}` = `active_project`, `{slug}` = `niche.slug`.

---

## Step 0 — LLM seed expansion

Прочитати `niche.keywords` з `projects/{project}/config.yaml`. Самостійно згенерувати ~20–30 пошукових запитів у 4 кошиках:

**(a) Біль-фрази** — шаблони болю/фрустрації навколо теми:
> "як перестати X", "проблема з Y", "чому Z не працює", "скільки коштує помилка в X"

**(b) Формат-фрази** — контентні формати + тема:
> "топ 5 порад про X", "помилка яка коштує Y", "один лайф-хак про X", "до і після X"

**(c) Тема-терміни** — суміжні теми, НЕ назви посад:
> конкретні болі, сценарії використання, суміжні продукти/процеси

**(d) Хештег-сіди** — без `#` (TikTok scraper їх додасть сам):
> тематичні хештеги, не загальні (#fyp, #viral виключити)

Зберегти у `artifacts/viral-factory/{project}/raw/{slug}-query-expansion.json`:
```json
{
  "baskets": {
    "pain": ["..."],
    "format": ["..."],
    "topic": ["..."],
    "hashtag": ["..."]
  },
  "all_queries": ["...всі 20–30 запитів у плоскому списку..."]
}
```

---

## Step 1 — Scrape content (Wave 1)

Переглянути план скрейпу: `python viral-factory/scripts/scrape.py --slug {slug} --keywords "..."`.

**1a. TikTok — global EN** — викликати Apify MCP:
- Актор: `clockworks/tiktok-scraper`
- Input: `{ "searchQueries": all_queries, "maxItems": 200, "resultsType": "posts", "proxyCountryCode": "US" }`
- Маппінг: `map_apify_response_to_collection(item, author_median_views=1, geo="global_en")`
- Тимчасово `author_median_views=1` — реальне значення буде в кроці 1f

**1b. TikTok — UA** — викликати Apify MCP:
- Актор: `clockworks/tiktok-scraper`
- Input: `{ "searchQueries": all_queries, "maxItems": 200, "resultsType": "posts", "proxyCountryCode": "UA" }`
- Маппінг: `map_apify_response_to_collection(item, author_median_views=1, geo="ua")`

**1c. Instagram Reels** — знайти найкращий доступний актор:
- Викликати `mcp__claude_ai_apify__search-actors` з query `"instagram reels scraper"`, обрати актор з найвищим рейтингом/популярністю
- Input (типовий): `{ "hashtags": basket_d_hashtags, "maxResults": 100 }`
- Маппінг: `map_instagram_response_to_collection(item, geo="global_en")`

**1d. Account scrape** — якщо `niche.accounts` не порожній:
- Актор: `clockworks/tiktok-profile-scraper`
- Input: `{ "profiles": niche.accounts, "maxItems": 30 }`
- Маппінг: `map_apify_response_to_collection(item, author_median_views=1, geo="global_en")`

**1e. Merge + dedup + filter** — об'єднати всі записи з 1a–1d:
- `dedup_by_video_id(records)` — видалити дублікати
- `filter_by_views(records, thresholds.min_views)` — відфільтрувати за мінімальними переглядами

**1f. Batch author-median** — ОДИН виклик `clockworks/tiktok-profile-scraper`:
- Зібрати унікальні author handles з відео, що пройшли фільтр (або мають `saves + shares > 0`) — ~40 кандидатів
- Один запуск: `{ "profiles": [всі handles], "resultsPerPage": 20 }`
- `compute_author_medians(profile_results)` → `{ handle → median_playCount }`
- Збагатити кожен запис реальним `author_median_views` (якщо handle не знайдений у відповіді — залишити `1`, але логувати)

**1g. Comments** — для кожного відео де `comments_count >= thresholds.min_comments`:
- Актор: `clockworks/tiktok-comments-scraper`
- Input: `{ "postUrls": [url], "commentsPerPost": 500 }`
- Додати як `comments[]` до запису

**1h. Download + transcribe top-50** — для топ-50 за переглядами:
- `yt-dlp -o "/tmp/viral-factory/{video_id}.%(ext)s" "{url}"`
- `whisper "/tmp/viral-factory/{video_id}.mp4" --model base --output_format json --word_timestamps True`
- При помилці для конкретного відео — логувати і продовжувати

**1i. Write raw output:**
- `artifacts/viral-factory/{project}/raw/{slug}.json` — `CollectionRecord[]`

Перевірити: файл існує і містить ≥ 10 записів. Якщо менше — попередити і запитати чи продовжувати.

---

## Step 2 — Score Wave 1

```bash
python viral-factory/scripts/score.py \
  --input  artifacts/viral-factory/{project}/raw/{slug}.json \
  --output artifacts/viral-factory/{project}/scored/{slug}.json
```

Прочитати результат. Перевірити якість:
- `median_top10 = median([top-10 niche_scores])`
- `strong_outliers = count(outlier_score >= thresholds.min_outlier)`

Незалежно від результату — перейти до Wave-2 (Step 3). Якщо `median_top10 < 0.35` АБО `strong_outliers < 3` — зробити Wave-2 обов'язковим і повідомити: *"Сигнал хвилі 1 слабкий — запускаю wave-2 harvest для підсилення."*

---

## Step 3 — Wave-2 harvest

З відео wave-1, що пройшли `filter_by_views`:
1. Зібрати топ-20 найчастіших `hashtags[]` (виключити загальні: "fyp", "viral", "trending", "tiktok")
2. Зібрати значущі ключові терміни з `caption` (довжина > 3 символи, не числа)

Запустити другий скрейп TikTok:
- Актор: `clockworks/tiktok-scraper`
- Input EN: `{ "searchQueries": [top-20 terms], "maxItems": 200, "proxyCountryCode": "US" }` → `geo: "global_en"`
- Input UA: `{ "searchQueries": [top-20 terms], "maxItems": 200, "proxyCountryCode": "UA" }` → `geo: "ua"`

Merge з wave-1: `dedup_by_video_id(wave1 + wave2)`. Для нових авторів — виконати додатковий батчований `clockworks/tiktok-profile-scraper` виклик.

Перезаписати raw output і перерахувати:
```bash
python viral-factory/scripts/score.py \
  --input  artifacts/viral-factory/{project}/raw/{slug}.json \
  --output artifacts/viral-factory/{project}/scored/{slug}.json
```

---

## Step 4 — Dedup/cap + select top-15

З фінального scored output:
1. Відсортувати за `niche_score` desc
2. `cap_per_author(records, max_per_author=3)` — не більше 3 відео на автора у вибірці
3. Взяти **топ-15** для fan-out аналізу (буфер: two-pass PainDensity може пересортувати топ-10, але всі вони гарантовано проаналізовані)

---

## Step 5 — Fan-out video-analyst

Для кожного з топ-**15** відео запустити `video-analyst` sub-agent паралельно. Передати:
- `video_url`: URL відео
- `transcript`: з scored record (може бути null)
- `video_file_path`: з scored record (може бути null)

Дочекатись завершення всіх агентів. Зберегти у `artifacts/viral-factory/{project}/extractions/{slug}.json` (масив ExtractionRecord).

Якщо менше 9 з 15 агентів повернули валідний JSON — повідомити які URL провалились і запитати чи перезапускати.

---

## Step 6 — Fan-out comment-miner

Для кожного з топ-15 відео де `comments` заповнений (масив не null і не порожній), запустити `comment-miner` sub-agent паралельно. Передати:
- `video_url`: URL відео
- `comments`: масив коментарів

Дочекатись завершення всіх агентів. Зберегти у `artifacts/viral-factory/{project}/comments/{slug}.json` (масив CommentMinerRecord).

Побудувати `painDensityMap: { video_id → pain_density_score }`.

---

## Step 7 — Two-pass: update scores with PainDensity

Застосувати `update_pain_density()` логіку з `score.py`: для кожного scored record замінити `pain_density` значенням з `painDensityMap` (або залишити поточне якщо даних немає).

Перевірити формулу:
```
niche_score = 0.40×outlier_score_norm + 0.30×save_share_rate_norm
            + 0.15×velocity_norm + 0.15×pain_density
```

Пересортувати. Фінальний **топ-10** для звіту = з оновленого рейтингу. Оскільки fan-out запускався на топ-15 — всі можливі топ-10 гарантовано мають дані аналізу.

Якщо `median(top-10 niche_score) < 0.35` після two-pass — повідомити: *"Медіана NicheScore топ-10 = {value:.2f} — ніша слабка. Рекомендую змінити ключові слова або нішу перед /spec-from-niche."*

---

## Step 8 — Cluster pain points

**8a. Підготовка pain items** (pure data transform, без LLM):
```bash
python viral-factory/scripts/cluster.py \
  --extractions artifacts/viral-factory/{project}/extractions/{slug}.json \
  --comments    artifacts/viral-factory/{project}/comments/{slug}.json \
  --output      artifacts/viral-factory/{project}/clusters/{slug}.json
```
Записує `artifacts/viral-factory/{project}/clusters/{slug}.json.items.json` — плоский масив `PainItem[]`.

**8b. Кластеризація через агент** — запустити `pain-clusterer` агент:
- `pain_items`: вміст `{slug}.json.items.json`
- `n_clusters`: 8

Дочекатись повернення `PainCluster[]` JSON масиву.

**8c. Зберегти кластери** — записати `artifacts/viral-factory/{project}/clusters/{slug}.json`:
```json
{
  "generated_at": "<current ISO timestamp>",
  "total_pain_points": <length of pain_items>,
  "n_clusters_requested": 8,
  "clusters": <PainCluster[] від агента, відсортовані за frequency × commercial_intent_score>
}
```

Визначити **топ-5 кластерів** за `frequency × commercial_intent_score`.

---

## Step 9 — Write the niche report

Записати `artifacts/viral-factory/{project}/niches/{slug}.md` з такою структурою:

```markdown
# Niche Report: {slug}
Generated: {date}
Project: {project}
Config: projects/{project}/config.yaml → niche.slug = {slug}

## Verdict
[Один абзац: варта ця ніша чи ні? Провести з найсильнішого сигналу — топ OutlierScore і хто автор.
Пряма відповідь: "сильний сигнал" або "слабкий сигнал" і чому.]

## Creator Leaderboard
[Автори, чиї формати подорожують. Критерій входу: ≥2 відео в топ-15 АБО OutlierScore ≥10× хоча б в одному відео. Сортування: топ OutlierScore desc.]

| Handle | Медіана переглядів | Топ OutlierScore | Кращий формат | Geo |
|--------|-------------------|-----------------|--------------|-----|
| @handle | 2.3M | 18.4× | pain-callout + transformation | global_en |

## Top Videos (by NicheScore)
| Rank | URL | NicheScore | OutlierScore | Views | Platform | Geo |
|---|---|---|---|---|---|---|
[Рядки для топ-10 відео. Platform: tiktok/reels. Geo: global_en/ua.]

## Geo Breakdown
| Geo | Відео (топ-15) | Медіана NicheScore |
|-----|---------------|-------------------|
| global_en | N | 0.XX |
| ua | N | 0.XX |
[Висновок: де сильніший сигнал, чи EN-формати вже є кандидатами для UA-локалізації]

## Recurring Formats
[3–5 найчастіших форматів відео у топ-15, з прикладами URL.
Використовувати лейбли з video-analyst: product-demo, before-after, pain-callout, etc.]

## Pain Clusters (Top 5)
[Для кожного кластера: назва, frequency, commercial_intent_score, 3 дослівні фрази, URLs джерел]

## Audience Portrait
[Синтез з comment-miner виводів. Хто вони, з чим борються, їхня мова.
Включити ≥5 сленгових фраз дослівно.]

## Hook Bank
[10 готових до тесту хуків. Мікс: з коментарів (з посиланням), з відкриттів відео, синтезовані.
Формат: 1. "текст хука" — [source: comment / video URL]]

## Recommended Next Step
[Одне з:
- "Запусти /decompose-video на ці URL для побудови шаблонів, потім /spec-from-niche"
- "Сигнал ніші слабкий — дивись Concerns перед тим як продовжувати"]

## Concerns
[Червоні прапорці: низькі outlier scores, мало даних коментарів, гео-невідповідність,
перевантажені конкурентами ніші, юридичні/ToS обмеження]
```

---

## Step 10 — Report to user

Після запису файлу, повідомити користувачу:
1. Шлях до файлу
2. Вердикт у 2 реченнях (сильний/слабкий, чому)
3. Топ креатор з Leaderboard (handle + топ OutlierScore)
4. Гео-розбивка (global_en vs ua — де сильніший сигнал)
5. Рекомендований наступний крок

Не відтворювати повний звіт у чаті — лише summary. Повний звіт у файлі.
