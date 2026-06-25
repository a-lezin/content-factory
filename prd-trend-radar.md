# PRD — viral-factory M1.2: Trend Radar (TikTok)

Summary: Модуль пошуку й визначення **нових трендів**, що заходять у TikTok прямо зараз — які звуки/хештеги/формати ростуть, **про що знімають**, і на якій стадії життя тренд. Користувач задає scope (вся платформа / ніша / регіон) → система збирає trend-сигнали зі snapshot-датами → окремим кроком визначає emerging-тренди з моментумом і прикладами.

Sources: [marketing-tech/viral-content-method.md](../../wiki/marketing-tech/viral-content-method.md) (метод), [architecture.md](architecture.md) (плагін), [prd-competitor-analysis.md](prd-competitor-analysis.md) (суміжний модуль), канал [startupfomo](https://t.me/s/startupfomo).

Last updated: 2026-06-23

Status: **draft PRD** (до реалізації).

---

## 0. Контекст і місце в системі

Модуль **M1.2** треку [Marketing Tech](../../wiki/marketing-tech/index.md) → плагін viral-factory.

**Чим відрізняється від M1.1 (Competitor Analysis):**
- M1.1 — **steady-state карта** конкретних конкурентів у ніші (хто що стабільно знімає).
- M1.2 — **моментум**: що *нове* й *росте* по TikTok загалом або в ніші, незалежно від конкретного автора. Питання не «хто», а «**що зараз залітає і про що знімають**».

Тренди живлять обидва контури: ідею продукту (`discover-niche`) і контент (`recreate-video`) — даючи формат/звук/тему на висхідній хвилі, а не після піку.

**Два явно розділені кроки** (як у M1.1):
- **Крок A — Збір**: scope → trend-сигнали (звуки, хештеги, формати, теми) → snapshot із датою.
- **Крок B — Визначення трендів**: що нове, що росте, на якій стадії, про що знімають.

---

## 1. Problem Statement

Віральний контент має **вікно**: формат/звук дає максимум на висхідній хвилі й вигорає після піку. Зараз ми ловимо тренди вручну й із запізненням — коли вони вже на спаді й перенасичені. Без системного радара ми **відтворюємо вчорашні тренди**, зливаючи ресурс на формати, які алгоритм уже не несе. Ціна — пропущені вікна можливостей і нижчий outlier на нашому контенті.

---

## 2. Goals

1. **Задати scope за <2 хв** і отримати список актуальних трендів без ручного серфінгу стрічки.
2. **Ловити тренд на висхідній стадії** (emerging/rising), а не після піку — вимірюваний lead time.
3. **Відрізняти НОВЕ від наявного**: система веде baseline і позначає `first_seen`, щоб «новий тренд» був справді новим.
4. **Відповідати «про що знімають»** — тематичні кластери сюжетів, не лише список хештегів.
5. **Кожен тренд — з датами, цифрами і прикладами-відео**, придатними для рішення «брати/не брати».

---

## 3. Non-Goals

1. **Генерація відео під тренд** — це `recreate-video` (M1.4).
2. **Глибокий конкурентний розбір** — це M1.1.
3. **Прогноз віральності конкретного нашого ролика** — це Higgsfield `virality_predictor` на кроці генерації.
4. **Instagram / YouTube** — лише TikTok у v1 (P2).
5. **Музичний/лейбл-аналіз звуків** — нас цікавить звук як контент-сигнал, не ліцензування.

---

## 4. Users

Внутрішній інструмент. Основний — **Growth PM / оператор** (Артем): задає scope, читає trend-звіт, вирішує що брати. Вторинний — **контент-команда**, що знімає під обрані тренди.

---

## 5. User Stories

**Крок A — Збір:**
- Як оператор, я хочу **задати scope** (вся платформа / конкретна ніша / регіон), щоб радар дивився туди, де мені треба.
- Як оператор, я хочу, щоб система зібрала **тренд-сигнали** (звуки, хештеги, формати, теми) з офіційних і скрапінг-джерел зі **snapshot-датою**.

**Крок B — Визначення:**
- Як оператор, я хочу окремою командою отримати **список emerging-трендів**, ранжований за моментумом.
- Як оператор, я хочу для кожного тренду бачити **стадію життя** (emerging→rising→peaking→saturating→declining), щоб не заходити на спаді.
- Як оператор, я хочу бачити **про що знімають** — тематичні кластери з прикладами.
- Як оператор, я хочу бачити, **до яких наших ніш/продуктів** тренд застосовний.
- Як оператор, я хочу, щоб **повторні прогони** показували динаміку (що прискорюється, що згасає).

---

## 6. Архітектура потоку

### Крок A — Збір (детермінований)

```
scope (config)
  → A1. Signal Pull        — TikTok Creative Center: trending sounds / hashtags / top ads / creators
  → A2. Velocity Sampling  — скрап свіжих відео по сигналах → метрики + posted_at
  → A3. Baseline Diff      — порівняти з історією → позначити НОВЕ (first_seen)
  → A4. Store Snapshot     — JSON зі snapshot_date + читабельний індекс
```

**A1. Signal Pull.** Головне джерело — **TikTok Creative Center** (напівофіційний, безкоштовний, низький ToS-ризик): trending hashtags, trending songs, top ads, breakout-прапори по регіону/категорії. Дає rising-сигнали в межах одного пулу.

**A2. Velocity Sampling.** По кожному сигналу тягнемо вибірку свіжих відео (метрики + `posted_at`) — щоб порахувати охоплення, recency і outlier.

**A3. Baseline Diff.** Звіряємо поточні сигнали з накопиченою історією (`seen`-набір). Те, чого не було → `first_seen = сьогодні`. Так «новий тренд» = справді новий, а не вічнозелений хештег.

**A4. Store Snapshot.** Запис зі `snapshot_date`. Повторний прогін → новий snapshot → база для velocity.

### Крок B — Визначення трендів (LLM + метрики поверх даних)

Окрема команда. Читає останній (та попередній — для динаміки) snapshot → видає trend-звіт (розділ 8).

> **Чесно про «нове/росте»:** надійна velocity потребує **≥2 snapshot'ів** у часі (P1). У v1 (один пул) опираємось на **breakout-прапори Creative Center + recency-weighted outlier + baseline diff** — це дає прийнятну апроксимацію «що зараз сходить».

---

## 7. Модель даних і зберігання

**Розкладка:**
```
artifacts/viral-factory/trends/{scope}/
  config.snapshot.json
  signals/{snapshot_date}.json     # сирі trend-сигнали на дату  ← snapshot
  baseline.json                    # накопичений seen-набір (first_seen по кожному сигналу)
  analysis/{date}.md               # trend-звіти кроку B
  index.md                         # огляд: коли скан, скільки нового
```

**Trend signal (запис):**
```json
{
  "trend_id","type": "sound|hashtag|format|topic","label",
  "scope": "global|{niche}|{region}",
  "first_seen","snapshot_date",
  "video_count","aggregate_views","median_outlier",
  "velocity_pct": null,            // приріст vs попередній snapshot (P1)
  "creative_center_breakout": true,
  "stage": "emerging|rising|peaking|saturating|declining",
  "momentum_score",
  "what_they_film": "опис теми/сюжету",
  "example_videos":[{"url","views","posted_at","outlier_score"}],
  "applicable_niches":[]
}
```
> `posted_at` прикладів + `snapshot_date` + `first_seen` = три дати, на яких тримається вся trend-логіка.

---

## 8. Крок B — що саме виводимо

Звіт `analysis/{date}.md`:

**Нові тренди (головне):**
- Список сигналів з `first_seen` у вікні (напр. останні 7–14 днів), ранжований за `momentum_score`.
- Для кожного: тип (звук/хештег/формат/тема), стадія, цифри, 2–3 приклади-відео з датами.

**Про що знімають (тематичні кластери):**
- Кластеризація сюжетів (embeddings на caption+транскрипт) → теми «про що контент» з представниками.
- Які болі/емоції/гачки стоять за темою.

**Стадія й моментум:**
- Класифікація кожного тренду по стадії життя; підсвітити **emerging/rising** (вікно для входу) і попередити про **saturating/declining**.

**Динаміка (P1, ≥2 snapshot):**
- Що прискорюється, що згасає між знімками (velocity).

**Застосовність:**
- Мапа тренд → наші ніші/продукти: де цей формат/тему можна підставити.

---

## 9. Requirements

### Must-Have (P0)
1. **Ввід scope через конфіг** (global / niche keywords / region+category).
   - AC: Given валідний конфіг, When запуск A, Then сигнали тягнуться в межах scope.
2. **Signal Pull з Creative Center** (trending hashtags + sounds як мінімум).
   - AC: зібрано ≥30 trending-сигналів зі scope з полями type/label/region.
3. **Velocity Sampling з метриками й датами.**
   - AC: кожен сигнал має вибірку відео з `posted_at`, views, outlier; порожні/недоступні логуються, не ламають прогін.
4. **Baseline Diff → first_seen.**
   - AC: сигнал, відсутній у `baseline.json`, отримує `first_seen=снапшот`; baseline оновлюється.
5. **Snapshot-збереження** за розкладкою розділу 7 (повторний прогін не перезаписує).
6. **Крок B**: окрема команда → `analysis/{date}.md` з новими трендами, стадією, тематичними кластерами, застосовністю; кожен тренд посилається на конкретні відео.
   - AC: звіт підсвічує emerging/rising окремо від saturating/declining.

### Nice-to-Have (P1)
7. **Cross-snapshot velocity** (`velocity_pct`) при ≥2 прогонах.
8. **Format/topic decomposition** через `video-analyst` (точніша класифікація формату й novelty).
9. **Niche-applicability scoring** — авто-ранг, до яких наших продуктів тренд пасує.
10. **Top-ads сигнал** Creative Center (що працює в платних — швидший сигнал комерційного інтенту).

### Future Considerations (P2)
11. Мультиплатформа (Reels/Shorts trending).
12. Розклад щоденного/щотижневого скану → безперервний радар + алерти на breakout.
13. Інтеграція зі `spec-from-niche`: тренд → одразу гіпотеза продукту.

---

## 10. Success Metrics

**Leading:**
- Time-to-scope-result: <2 хв до зібраних сигналів.
- Freshness: ≥X нових (`first_seen`) сигналів за скан.
- Coverage: ≥30 сигналів + ≥5 тематичних кластерів за scope.
- Time-to-insight: крок B <5 хв.

**Lagging:**
- **Lead time:** середній лаг між нашим `first_seen` і піком тренду — ціль: ловити **до** піку (позитивний lead time).
- % трендів зі звіту, узятих у `recreate-video`, що дали outlier у нас.
- Скорочення ручного trend-серфінгу (baseline: години/тиждень → <30 хв).

---

## 11. Open Questions

- **[eng]** Чи є стабільний доступ до TikTok Creative Center даних (офіційний експорт / актор)? Підтвердити джерело й ліміти. (blocking для A1)
- **[eng]** Як технічно отримати «breakout/rising»-прапор — з Creative Center напряму чи рахувати самим із velocity? (впливає на P0 vs P1 для стадії)
- **[data]** Поріг `momentum_score` і правила класифікації стадій — калібрувати на першому скані.
- **[data]** Вікно «нове» для first_seen (7 / 14 / 30 днів) — визначити.
- **[legal]** Зберігання scraped trend-даних — межі (як у розділі 8.1 архітектури).

---

## 12. Timeline / Phasing

- **Фаза 1 (P0):** A1–A4 + крок B на одному snapshot (стадія за breakout-прапором + recency). Валідація на одному scope.
- **Фаза 2 (P1):** cross-snapshot velocity + decomposition + niche-applicability + top-ads.
- **Фаза 3 (P2):** розклад + алерти + мультиплатформа + лінк у spec-from-niche.

Залежності: спільна на підтверджені джерела (Creative Center / Apify-актори) і схеми з [architecture.md](architecture.md). Сумісність даних з M1.1 (спільні поля відео).

---

## Related pages
- [prd-competitor-analysis.md](prd-competitor-analysis.md) — M1.1 (суміжний модуль: конкуренти)
- [architecture.md](architecture.md) — архітектура плагіна
- [marketing-tech/viral-content-method.md](../../wiki/marketing-tech/viral-content-method.md) — метод (Novelty, outlier, вікно тренду)
- [marketing-tech/index.md](../../wiki/marketing-tech/index.md) — індекс треку
