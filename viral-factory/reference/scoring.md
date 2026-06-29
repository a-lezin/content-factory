# Scoring Reference

## NicheScore Formula

```
NicheScore = 0.40 × OutlierScore_norm
           + 0.30 × SaveShareRate_norm
           + 0.15 × Velocity_norm
           + 0.15 × PainDensity
```

Всі `_norm` компоненти — min-max нормалізація в межах поточного батчу до [0, 1].

### Component Breakdown

| Компонент | Вага | Джерело | Що вимірює |
|---|---|---|---|
| OutlierScore_norm | **40%** | views / author_median | Сила формату, незалежна від аудиторії |
| SaveShareRate_norm | **30%** | (saves + shares) / views | Бажання повернутися або поширити |
| Velocity_norm | **15%** | views / days_since_posted | Швидкість поширення |
| PainDensity | **15%** | comment-miner output | Частка коментарів, що виражають біль |

> **Чому немає Monetization:** TikTok Shop недоступний в UA, тому GMV завжди 0 → NicheScore мав штучну стелю ~0.34. Мета discover-нішу переформульована: не "валідувати willingness-to-pay", а **зібрати лідерів ніші** — формати що подорожують і кластери аудиторії. Монетизацію перевіряємо окремо через /spec-from-niche.

---

## OutlierScore

```
OutlierScore = views / author_median_views
```

**Чому не абсолютні перегляди:** великий акаунт і так отримує перегляди завдяки аудиторії. OutlierScore ізолює змінну "формат" від змінної "аудиторія".

**Важливо:** `author_median_views` має бути **реальним** — з батчового profil-скрейпу (один виклик `clockworks/tiktok-profile-scraper` з усіма handles). Ніколи не підставляй проксі `1.0×` для авторів у топ-пулі — це знищує сигнал.

**Порогове значення:** `thresholds.min_outlier` у config.yaml, рекомендовано **≥ 10**.

| OutlierScore | Інтерпретація |
|---|---|
| < 2 | Слабкий сигнал — відео в нормі для цього акаунта |
| 2–10 | Помірний outlier |
| 10–50 | Сильний сигнал формату |
| > 50 | Дуже сильний — перевірити на аномалії (viral luck) |

**Як порахувати author_median_views:** останні 20 відео автора, медіана переглядів. Якщо даних менше — використовувати наявні. Функція `compute_author_medians()` в `scrape.py`.

---

## SaveShareRate

```
SaveShareRate = (saves + shares) / views
```

Saves і shares — вищий інтент, ніж лайк. Save означає "хочу повернутися". Share означає "хочу, щоб інший це побачив".

**Орієнтири:**
- `< 0.01` — низький
- `0.01–0.03` — нормальний
- `> 0.03` — сильний сигнал (топ ~1.3% відео по TikTok)

**Для Instagram Reels:** saves важливіші за shares (shares не завжди публічні). Поточна формула однаково враховує обидва — адекватно для cross-platform батчу.

---

## Velocity

```
Velocity = views / days_since_posted
```

Вимірює швидкість набору переглядів. Мінімум — 0.5 дня (щоб уникнути division explosion для новопублікованих відео).

Velocity корисна для відфільтрування "старих вірусних відео" від актуальних трендів.

---

## PainDensity

```
PainDensity = pain_comments / total_comments
```

Де "pain_comments" — коментарі, що виражають проблему, бажання або запит (на відміну від реакцій "lol", "🔥").

Рахується агентом `comment-miner` для кожного відео. Дефолт **0.5** якщо comment-miner ще не запускався.

---

## Sprint Median Evaluation

Оцінюй нішу по **медіані NicheScore топ-10 відео**, а не по топ-1.

Ніша де top-1 = 0.9, median = 0.3 → слабша за нішу де top-1 = 0.7, median = 0.65.

**Автоматична wave-2:** якщо `median(top-10 NicheScore) < 0.35` АБО `count(outlier_score >= min_outlier) < 3` — skill автоматично запускає другу хвилю скрейпу з harvested hashtags.

---

## Filters (Пороги для скорингу)

З `thresholds` у `projects/{project}/config.yaml`:

| Поле | Дефолт | Що фільтрує |
|---|---|---|
| `min_views` | 50,000 | Мінімум переглядів для включення у вибірку |
| `min_comments` | 1,000 | Мінімум коментарів для глибокого аналізу comment-miner |
| `min_outlier` | 10 | Поріг для auto-iteration та попередження |

---

## Calibration Notes

Ваги затверджені після першого реального прогону (pr-pros-ua, 2026-06-28):
- Monetization видалено: TikTok Shop не активний в UA, давав штучну стелю NicheScore
- OutlierScore підвищено до 40%: головний сигнал, але лише з реальними author_median_views
- SaveShare підвищено до 30%: найбільш надійний engagement-сигнал cross-platform
- Для B2B-ніш (мало коментарів) PainDensity залишається на 15% — не критично
