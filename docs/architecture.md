# viral-factory — архітектура плагіна

Summary: Дизайн портативного плагіна Claude Code для пошуку продуктових ідей через моніторинг віральних відео (TikTok/Reels), декомпозиції winning-форматів і відтворення нових відео з власним продуктом. Метод горизонтальний — підключається в будь-який продуктовий репозиторій 12N.

Sources: канал [startupfomo](https://t.me/s/startupfomo) (метод вірального росту), внутрішні обговорення Factory (POE/PSE).

Last updated: 2026-06-23

Status: **design-only** (код не реалізовано; будуємо в наступній сесії).

---

## 1. Головний принцип: розділення МЕТОДУ і КОНТЕКСТУ

Плагін містить **тільки метод** — логіку, формули, схеми, промпти. Усе, що специфічне для конкретного продукту (ніша, ЦА, бренд-voice, дані продукту), **живе в репозиторії продукту** і підтягується плагіном у рантаймі.

| Шар | Що це | Де живе | Чому |
|---|---|---|---|
| **Метод** | discovery-логіка, scoring-формула, extraction-схеми, пайплайн генерації | плагін | стабільне, переноситься між продуктами |
| **Контекст** | seed-keywords, ЦА, бренд-voice, дані продукту | репо продукту | змінне, своє для кожного апу |

> Один і той самий плагін у Watchover дає safety/parenting-фокус, у наступному апі — інший, бо контекст читається локально. Це робить його **reusable** і **project-aware** одночасно.

### Як плагін читає контекст проєкту (порядок пріоритету)
1. `viral-factory.config.yaml` у корені репо продукту (явний конфіг — головне джерело).
2. `wiki/overview.md` + `CLAUDE.md` репо (бізнес-контекст, аудиторія, обмеження).
3. Якщо чогось бракує — скіл питає користувача (а не хардкодить).

---

## 2. Теорія: чому ця логіка працює

Цей розділ пояснює *чому* пайплайн побудований саме так. Кожен наступний інженерний вибір — наслідок одного з цих принципів.

### 2.1. Content-Market Fit передує Product-Market Fit
Класична логіка: зроби чудовий продукт → знайди, як його продати. У перенасиченому ринку апів (24k subscription-апів за 3 міс, <3% заробили хоч $100 — RevenueCat) **дефіцитний ресурс — не продукт, а робочий канал дистрибуції**. Для гарного продукту може просто не існувати вигідної дистрибуції.

Тому ми інвертуємо порядок: спершу знаходимо **контент, який алгоритм сам несе в стрічку**, і лише потім вбудовуємо продукт у цей контент. Органіка — найдешевший канал (дешевша за paid ads, швидша за SEO/ASO), але тільки якщо контент-гіпотеза знайдена **до** запуску продукту. Звідси весь пайплайн стартує з аналізу відео, а не з ідеї апу.

### 2.2. Сигнал — це outlier, а не середнє
Велике охоплення саме по собі — шум: великий акаунт і так отримує перегляди завдяки аудиторії. Нас цікавить **аномалія: маленький акаунт із вірусним відео**.

Чому: outlier на малому акаунті **ізолює змінну «формат» від змінної «аудиторія»**. Якщо відео зробило ×20 від медіани автора, який має 500 підписників — вистрілив сам контент, а не фоловери. Це фактично природний експеримент, що доводить: формат *подорожує*. Тому ключова метрика — `OutlierScore = views / median(author)`, а не абсолютні перегляди.

### 2.3. Коментарі — найчесніше джерело про аудиторію
Опитування й кабінетні дослідження дають те, що люди *кажуть*. Коментарі під вірусним відео — це **revealed preference в точці контакту**: реальна аудиторія сама, своєю мовою, описує болі саме там, де ти її потім досягатимеш.

З них одним проходом дістаємо одразу п'ять активів: валідацію проблеми, портрет ЦА, ідеї фіч, **сленг** (для майбутніх скриптів) і **готові хуки**. Дешевше й точніше за будь-який survey.

### 2.4. TikTok Shop revenue — найсильніший сигнал ніші
Перегляди ≠ готовність платити. Ролик на 1М може не принести й цента. TikTok Shop **замикає петлю**: показує точну виручку, прив'язану до конкретного контент-формату. Це переводить нас від «vanity-віральності» до **доведеної willingness-to-pay**.

Логіка-місток: якщо ролик продав фізтовар на $10k, його механіка переконання вже працює — лишається підставити свій інтерфейс замість товару. Тому Shop-сигнал має найбільшу вагу в скорингу.

### 2.5. «Продукт = контент»: віральність як продуктове обмеження
В органіці реклама і є контент. Якщо продукт не можна **залипально показати за 3 секунди**, у нього немає органічної дистрибуції. Отже віральність — це не маркетингова надбудова, а **обмеження на дизайн продукту**: у MVP закладається ОДНА демо-фіча, яку видно в кадрі 100% хронометражу.

Драйвер алгоритму — **Novelty**: знайоме у новій, «AI»-упаковці (декоративний візуал теж рахується). Тому в декомпозиції ми окремо фіксуємо `novelty_element` і `product_in_frame`.

### 2.6. Реплікація формату, а не оригінальна творчість
Творчість з нуля = висока дисперсія й непередбачуваність. Формат, що **вже** вистрілив, має доведену hook-механіку. Підставляючи свій продукт у такий шаблон, ми **тримаємо доведену змінну сталою** і міняємо лише необхідне. Нижча ціна помилки, повторюваність, масштабованість дешевими креаторами. Звідси скіл `recreate-video` працює через template-swap, а не «придумай ролик».

### 2.7. Оцінюємо медіану спринту, а не окреме відео
Віральність стохастична: будь-який окремий ролик — переважно шум. Сигнал — у **медіані пачки з 10**. Оцінка по одному відео веде до хибних висновків і вигорання.

Практична діагностика провалу: 0–10 переглядів = технічна проблема (акаунт не прогрітий / VPN), а не контент; <200 = техніка ок, але гіпотеза не зачепила. Тому петля вимірювання працює спринтами, а не покадрово.

### 2.8. Уся петля — це алгоритм пошуку
Загалом ми запускаємо **дешеві паралельні експерименти в просторі ідей**. AI обвалив вартість одного експерименту майже до нуля (ідея → MVP → пачка відео за дні й $0). Тому виграє не той, хто зробив кращий продукт, а **хто швидше перебирає гіпотези**. Архітектура плагіна (fan-out агенти, детерміновані скрипти, накопичувана бібліотека форматів) — це інструмент максимізації швидкості цього пошуку.

### 2.9. Збір і аналіз — розділені; дані версіонуються snapshot'ами
*(додано після PRD M1.1/M1.2)* Збір (scrape) і аналіз (insight) — окремі кроки: збір пише **snapshot із датою**, аналіз читає snapshot. Це дає три речі: (1) **дешевий переаналіз** без повторного скрапу; (2) **тренди в часі** — порівняння snapshot'ів дає velocity (що росте / насичується); (3) **кілька аналітичних скілів над одними зібраними даними**. «Нове» (`first_seen`), «динаміка» (`velocity`) і «стадія тренду» можливі лише завдяки версіонуванню — без нього система бачила б статичний зріз.

---

## 3. Розкладка файлів плагіна

```
viral-factory/
  plugin.json                  # маніфест: назва, версія, MCP-залежності (Apify, Higgsfield)
  README.md                    # як підключити в репо продукту

  skills/
    # --- Аналітичні скіли (читають snapshot, 2.9) ---
    analyze-competitors/       # M1.1: конкуренти → що/як заходить    (prd-competitor-analysis.md)
      SKILL.md
    trend-radar/               # M1.2: нові тренди, стадія, про що знімають (prd-trend-radar.md)
      SKILL.md
    discover-niche/            # синтез competitor+trend+shop snapshot → топ-ніші/ідеї
      SKILL.md
    decompose-video/           # winning-відео → format-template
      SKILL.md
    spec-from-niche/           # ніша → product brief
      SKILL.md
    recreate-video/            # template + продукт → скрипти/генерація
      SKILL.md

  agents/
    video-analyst.md           # multimodal-витяг на ОДНЕ відео (fan-out воркер)
    comment-miner.md           # майнінг коментарів у структуру (fan-out воркер)

  scripts/                     # --- Шар збору (детермінований, пише snapshot) ---
    scrape.ts                  # контент/відео → JSON (Apify)
    competitors.ts             # discovery + ранг авторів-конкурентів (M1.1)
    trends.ts                  # Creative Center pull + baseline diff (M1.2)
    snapshot.ts                # запис snapshot із датою + оновлення baseline
    score.ts                   # детермінована формула NicheScore
    cluster.ts                 # embeddings + кластеризація (болю / тем)
    schemas/                   # JSON-схеми (video, competitor, trend, shop)

  reference/
    method.md                  # повний метод (теза CMF, бенчмарки, case-bank)
    scoring.md                 # формула, ваги, пороги-фільтри
    extraction-prompts.md      # готові промпти для аналізу відео й коментарів
    video-templates.md         # каталог winning-форматів (накопичується)
```

### У репозиторії продукту (НЕ в плагіні)
```
<product-repo>/
  viral-factory.config.yaml          # ніша/scope, seed, ЦА, дані продукту
  artifacts/viral-factory/
    niches/{slug}/                   # M1.1: competitors.json, videos/{date}.json, analysis/{date}.md
    trends/{scope}/                  # M1.2: signals/{date}.json, baseline.json, analysis/{date}.md
    specs/{product}.md               # spec-from-niche
```
> Папки `videos/` і `signals/` тримають **по файлу на snapshot-дату** (не перезаписуються); `baseline.json` накопичує `first_seen`. Це й реалізує принцип 2.9.

---

## 4. Скіли (entry-points по фазах)

Кожен скіл — user-invocable, з чіткими input/output. Скіли читають контекст із репо, делегують важкий fan-out агентам, детерміновані шматки — скриптам.

**Збір vs аналіз (2.9):** скрипти-збору пишуть snapshot; аналітичні скіли його читають. Мапа на PRD: `analyze-competitors` = [M1.1](prd-competitor-analysis.md), `trend-radar` = [M1.2](prd-trend-radar.md). Деталі inputs/outputs цих двох — у відповідних PRD; нижче — короткі картки.

### 4.1 `discover-niche`
- **Тригер:** «знайди нішу», «discover niche», «що залітає в {вертикаль}».
- **Input:** `viral-factory.config.yaml` (seed-keywords, accounts, shop-queries, пороги).
- **Робить:**
  1. `scripts/scrape.ts` → сирі відео (контент + TikTok Shop) у JSON.
  2. fan-out `video-analyst` + `comment-miner` по відео, що пройшли пороги.
  3. `scripts/cluster.ts` → кластери болю.
  4. `scripts/score.ts` → `NicheScore` на кластер.
- **Output:** `artifacts/viral-factory/niches/{slug}/analysis/{date}.md` — топ-3 ніші з болем, портретом ЦА, доказом монетизації (Shop revenue) і посиланнями на winning-відео.
> Після введення спільного шару збору (2.9) `discover-niche` **синтезує** наявні snapshot'и (competitor / trend / shop), а не скрапить сам — скрап живе в скриптах-збору.

### 4.2 `decompose-video`
- **Тригер:** «розбери це відео», «decompose», список URL winner'ів.
- **Input:** 1–N video URL (або вибірка з discover-niche).
- **Робить:** fan-out `video-analyst` → структурована декомпозиція (hook, structure, format, novelty, product-in-frame, CTA, sound).
- **Output:** запис у `reference/video-templates.md` (накопичувана бібліотека форматів) + краткий звіт.

### 4.3 `spec-from-niche`
- **Тригер:** «зроби spec», «product brief з ніші».
- **Input:** ніша з discover-niche + контекст продукту з конфігу/wiki.
- **Робить:** збирає product brief за каркасом «онбординг + paywall + ОДНА демо-фіча»; перевіряє на правило «продукт = контент» (2.5); попереджає про копіювання (2.1).
- **Output:** `artifacts/viral-factory/specs/{product}.md`.

### 4.4 `recreate-video`
- **Тригер:** «згенеруй відео», «recreate з шаблону».
- **Input:** format-template (з 4.2) + дані продукту (конфіг) + screen-record демо.
- **Робить:** LLM-скрипт під продукт (template-swap, 2.6) → генерація (Higgsfield/Veo/Kling) → 5–10 варіацій хука → прогноз через `virality_predictor`.
- **Output:** пачка скриптів + згенеровані ролики + прогноз віральності.

### 4.5 `analyze-competitors` (M1.1 — [PRD](prd-competitor-analysis.md))
- **Тригер:** «аналіз конкурентів», «хто крутиться в {ніша}».
- **Input:** ніша з конфігу; ініціює/читає competitor + video snapshot.
- **Робить:** Competitor Discovery (+ human gate) → Video Harvest → enrichment (outlier / save / share) → snapshot; аналіз: топ-формати, хук-патерни, тренди within/cross-snapshot, whitespace, per-competitor профілі.
- **Output:** `niches/{slug}/competitors.json` + `videos/{date}.json` + `analysis/{date}.md`.

### 4.6 `trend-radar` (M1.2 — [PRD](prd-trend-radar.md))
- **Тригер:** «що зараз тренд», «нові тренди в TikTok».
- **Input:** scope (global / niche / region) з конфігу.
- **Робить:** Signal Pull (Creative Center) → Velocity Sampling → Baseline Diff (`first_seen`) → snapshot; аналіз: нові тренди за моментумом, стадія життя, тематичні кластери «про що знімають», застосовність до наших ніш.
- **Output:** `trends/{scope}/signals/{date}.json` + `baseline.json` + `analysis/{date}.md`.

---

## 5. Субагенти (fan-out воркери)

Аналіз сотень відео — класичний fan-out з ізольованим контекстом. Тому окремі агенти, а не вшито в скіл.

### `video-analyst`
- **Input:** одне відео (file URL).
- **Інструменти:** yt-dlp (завантаження), Whisper (транскрипт+тайм-коди), Gemini video-understanding (візуальна декомпозиція) — див. розділ 8.
- **Output (schema):** `{ hook, structure[], format, novelty_element, product_in_frame, cta, pacing, sound_role }`.

### `comment-miner`
- **Input:** усі коментарі одного ролика.
- **Output (schema):** `{ pain_points[], feature_requests[], audience_portrait, slang_and_phrases[], ready_hooks[], commercial_intent[] }`.

---

## 6. Скрипти (детерміновані, не-LLM)

| Скрипт | Що робить | Сервіс |
|---|---|---|
| `scrape.ts` | контент/відео + TikTok Shop → JSON за схемою | Apify (див. розділ 8) |
| `competitors.ts` | discovery + ранг авторів-конкурентів (M1.1) | Apify |
| `trends.ts` | trend-сигнали + baseline diff (M1.2) | Creative Center / Apify |
| `snapshot.ts` | запис snapshot із датою + оновлення baseline | локальний код |
| `score.ts` | `NicheScore` по формулі | локальний код |
| `cluster.ts` | embeddings + кластеризація (болю / тем) | embeddings-модель |

**NicheScore** (ваги — стартові, калібруємо після першого прогону):
```
NicheScore = 0.35*Monetization + 0.25*OutlierScore + 0.20*SaveShareRate
           + 0.10*Velocity + 0.10*PainDensity
```
Ваги відображають теорію: монетизація (2.4) і outlier (2.2) — найсильніші сигнали.
Фільтри-пороги: OutlierScore ×10+, V2I-орієнтир >1% (топ 1.3%), 1k+ коментарів для глибокого аналізу.

---

## 7. Схеми даних

### Collection (на відео)
```json
{
  "video_id","platform","url","author","author_url","posted_at","duration_sec",
  "views","likes","comments_count","shares","saves",
  "caption","hashtags":[],"sound_id","sound_is_trending",
  "video_file_url","author_median_views","scraped_at"
}
```

### TikTok Shop (на товар)
```json
{ "product_name","category","monthly_revenue","units","top_videos":[{"url","revenue","views"}] }
```

### Competitor (M1.1 — повні поля в [PRD](prd-competitor-analysis.md))
```json
{ "handle","display_name","url","followers","median_views",
  "niche_relevance_score","has_app_link","has_shop","confirmed_by_human","first_seen" }
```

### Trend signal (M1.2 — повні поля в [PRD](prd-trend-radar.md))
```json
{ "trend_id","type":"sound|hashtag|format|topic","label","scope",
  "first_seen","snapshot_date","video_count","aggregate_views","median_outlier",
  "velocity_pct","stage","momentum_score","what_they_film","example_videos":[],"applicable_niches":[] }
```

### Snapshot-конвенція (2.9)
Збір пише у `…/{date}.json` і **не перезаписує** попередні; `baseline.json` тримає seen-набір із `first_seen`. Cross-snapshot порівняння → `velocity`.

### Extraction / Comments — див. output-схеми агентів у розділі 5.

---

## 8. Інструменти та джерела даних

### 8.1 Збір даних: пряме TikTok API vs скрапери

> **Важливо (виправлення поширеного припущення):** офіційне TikTok API **не покриває** discovery-кейс. Тому скрапери — це **основне** джерело даних, а пряме API — нішевий додаток, а не навпаки.

Чому пряме API не підходить для нашого кейсу:

| Офіційне API | Що дає | Обмеження |
|---|---|---|
| **Research API** | метадані відео + коментарі за keyword/hashtag | gated (approval), **non-commercial**, лише US/EU дослідники — не для продакшну |
| **Display API** | контент | лише **власний** авторизований акаунт |
| **Creative Center** | тренди хештегів/звуків, Top Ads | напівофіційно, web; **без повних engagement-метрик** по довільних відео |
| **TikTok Shop Open API** | дані магазину | лише для **seller/partner** акаунтів |

**Висновок:** для горизонтального discovery по чужих нішах офіційні канали або заборонені умовами, або не дають потрібних полів (views/median автора, усі коментарі, revenue по чужому ролику). Тому:

| Шар даних | Основне джерело | Запасні / альтернативи | Роль |
|---|---|---|---|
| Контент TikTok/IG (метрики, коментарі) | **Apify** (вже підключено через MCP) | EnsembleData, TikAPI, Bright Data | workhorse скрапінгу |
| Тренд-сигнали (звуки, хештеги, breakout) | **TikTok Creative Center** (free, низький ToS-ризик) | Apify Creative Center-актори | **основне** джерело для M1.2 Trend Radar |
| Revenue по нішах/ролику | **Kalodata / FastMoss / EchoTik** | Apify Shop-актори | сигнал монетизації (2.4) |
| Пряме API | Research API | — | опційно, лише якщо отримаємо доступ |

#### TikTok Shop — джерела аналітики (сигнал монетизації, 2.4)

**Спеціалізовані платформи** (рахують *оцінену* виручку: per-product, per-video, creator GMV, історичні тренди — те, що дає сигнали «$789k/міс на товар» і «$10k з одного ролика»):

| Сервіс | Сильна сторона | Нюанс | API |
|---|---|---|---|
| **FastMoss** | де-факто індустріальний стандарт; ~500M товарів, історія ~3 роки; метрика «Sales Efficiency» (GMV/1k переглядів) | tracks **intent** — може завищувати продажі | так |
| **Kalodata** | найглибші дані; бенчмарки AOV по підкатегоріях | пропускає частину «shadow sales» з приватних лайвстрімів (−12–15% по live-GMV) | так |
| **EchoTik** | найсильніший **free-tier**; Chrome-overlay з оцінкою revenue на кожне відео в стрічці | tracks **settled** (фактично оплачені) — консервативніше | так |
| **Shoplus** | бюджетна альтернатива | менша глибина | так |

> ⚠️ Оцінки виручки між сервісами **різняться на 12–15%** (FastMoss рахує intent, EchoTik — settled). Для рішення по ніші — крос-чекати щонайменше два джерела.

**Чи покриває це Apify — так, частково.** У Store є окремі TikTok Shop актори (`parseforge/tiktok-shop-scraper`, `pro100chok/tiktok-shop-scraper`, `coregent/tiktok-shop-product-scraper`) — JSON, ~$2/1k результатів або ~$20/міс. Тягнуть: ціни, **sold-count**, рейтинги, seller info, варіанти; частина акторів декларує і **creator GMV/sales/engagement**.

**Але різниця в шарі:**
- **Apify** віддає *скраплені сирі поля* (sold-count × ціна → виручку рахуєш сам). Без історичних трендів і без per-video attribution.
- **Спеціалізовані тули** дають *модельовану* виручку з історією, прив'язкою до конкретного ролика, creator-efficiency і категорійними бенчмарками.

**Рекомендація для пайплайну:**
- **Автоматична інтеграція в `scrape.ts`** → Apify TikTok Shop актор (JSON лягає в схему Shop, дешево, без окремого контракту).
- **Глибокий ресерч ніші / revenue на ролик / історія** → FastMoss або Kalodata API; EchoTik free-tier + Chrome-overlay — для ручного експлорингу.

#### ToS-ризик

> ⚠️ Скрапінг суперечить ToS платформ — для продакшн-продукту це юридичний ризик, який треба оцінити окремо (rate limits, проксі, зберігання даних). На етапі discovery/research прийнятно; перед масштабуванням — перевірити з legal.

### 8.2 Аналіз самого відео: які моделі

Аналіз — це не одна модель, а **конвеєр**, де кожен крок іде на модель, сильну саме в ньому:

| Крок | Модель / інструмент | Чому саме вона |
|---|---|---|
| **Транскрипт + тайм-коди** | **Whisper** (`faster-whisper`, локально) | дешево, офлайн, точні тайм-коди; альтернатива — AssemblyAI/Deepgram |
| **Візуальна + аудіо декомпозиція** | **Gemini** (2.5-клас, нативне відео) | **їсть відео цілком** (кадри+звук+тайм-коди), довгий контекст, дешево за хвилину — головна робоча модель для розбору |
| **Reasoning / витяг у схему, майнінг коментарів** | **Claude** (Opus/Sonnet) | найсильніший у структурованому судженні над транскриптом+коментарями (output за JSON-схемою) |
| **Прогноз віральності (перед заливкою)** | **Higgsfield** `virality_predictor` | доменна модель оцінки hook/retention; відсіює слабкі варіанти до публікації |
| **Генерація відео** | Higgsfield `generate_video`, Veo, Kling, Nanobanana (image), Sora 2; аватари — HeyGen/Arcads | реалістичний контент, неотличимий від зйомки |

**Логіка розподілу Gemini vs Claude:** Gemini нативно приймає сире відео й дешевий per-minute — тому він робить «очі» (що в кадрі, коли з'являється продукт, який novelty-елемент). Claude сирий відеопотік не приймає, але сильніший у структурованому висновку — тому він робить «мозок» (зведення транскрипту + коментарів у формат-template і pain points). Якщо потрібна frames-based модель — кадри ріжемо через `ffmpeg` (keyframes).

---

## 9. config.yaml у репо продукту (приклад-каркас)

```yaml
niche:
  slug: watchover
  keywords: ["how to track my kid", "screen time fight", "teen safety online"]
  accounts: ["@competitor1", "@competitor2"]
  shop_queries: ["parental control", "family safety"]
thresholds:
  min_views: 50000
  min_comments: 1000
  min_outlier: 10
product:                      # для recreate-video
  name: Watchover
  one_demo_feature: "..."
  brand_voice: "..."
  screen_record_path: "..."
audience:
  portrait: "..."
  slang: ["..."]
```

---

## 10. Дорожня карта побудови (фази)

1. **Каркас плагіна** — структура файлів, `plugin.json`, README, reference/method.md (перенести вже зібраний метод).
2. **Спільний шар збору** — `scrape.ts` + `snapshot.ts` + агент `video-analyst`.
3. **M1.1 `analyze-competitors` наскрізно** ([PRD](prd-competitor-analysis.md)) → **валідація на одній реальній ніші**. ← перший робочий модуль.
4. **M1.2 `trend-radar`** ([PRD](prd-trend-radar.md)) на спільному шарі збору.
5. **`discover-niche`** (синтез competitor+trend+shop snapshot) + `score.ts`/`cluster.ts`; калібрування ваг скорингу.
6. Дорощування `decompose-video` → `spec-from-niche` → `recreate-video`.
7. Винесення в plugins submodule, підключення в перший продуктовий репо.

> Принцип: каркас правильний одразу, але реалізуємо й валідуємо фази по черзі, щоб не абстрагувати непровірений метод.

---

## Related pages
- [prd-competitor-analysis.md](prd-competitor-analysis.md) — M1.1 Competitor Analysis (PRD)
- [prd-trend-radar.md](prd-trend-radar.md) — M1.2 Trend Radar (PRD)
- [marketing-tech/index.md](../../wiki/marketing-tech/index.md) — індекс треку Marketing Tech
- reference/method.md (повний метод вірального росту — TODO при побудові)
- [startupfomo](https://t.me/s/startupfomo) — першоджерело методу
