# Scoring Reference

## NicheScore Formula

```
NicheScore = 0.35 × Monetization
           + 0.25 × OutlierScore_norm
           + 0.20 × SaveShareRate_norm
           + 0.10 × Velocity_norm
           + 0.10 × PainDensity
```

Всі `_norm` компоненти — min-max нормалізація в межах поточного батчу до [0, 1].

### Component Breakdown

| Компонент | Вага | Джерело | Що вимірює |
|---|---|---|---|
| Monetization | **35%** | TikTok Shop | Willingness-to-pay в цій ніші |
| OutlierScore_norm | **25%** | views / author_median | Сила формату, незалежна від аудиторії |
| SaveShareRate_norm | **20%** | (saves + shares) / views | Бажання повернутися або поширити |
| Velocity_norm | **10%** | views / days_since_posted | Швидкість поширення |
| PainDensity | **10%** | comment-miner output | Частка коментарів, що виражають біль |

---

## OutlierScore

```
OutlierScore = views / author_median_views
```

**Чому не абсолютні перегляди:** великий акаунт і так отримує перегляди завдяки аудиторії. OutlierScore ізолює змінну "формат" від змінної "аудиторія".

**Порогове значення:** `thresholds.min_outlier` у config.yaml, рекомендовано **≥ 10**.

| OutlierScore | Інтерпретація |
|---|---|
| < 2 | Слабкий сигнал — відео в нормі для цього акаунта |
| 2–10 | Помірний outlier |
| 10–50 | Сильний сигнал формату |
| > 50 | Дуже сильний — перевірити на аномалії (viral luck) |

**Як порахувати author_median_views:** останні 20 відео автора, медіана переглядів. Якщо даних менше — використовувати наявні.

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

Часто корелює з "buyer intent" контентом — де продукт є рішенням конкретного болю.

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

PainDensity усереднюється по батчу і підставляється в NicheScore.

---

## Monetization Signal

Відображає willingness-to-pay в ніші через TikTok Shop дані.

| Monthly revenue (топ продукт в ніші) | Monetization score |
|---|---|
| < $10k | 0.1 |
| $10k – $50k | 0.3 |
| $50k – $200k | 0.6 |
| > $200k | 0.9 |

**Дефолт:** 0.3 якщо даних Shop немає.

**Чому найбільша вага (35%):** це єдиний компонент, що безпосередньо доводить, що люди платять. Решта сигналів — attention, не revenue.

---

## Sprint Median Evaluation

Оцінюй нішу по **медіані NicheScore топ-10 відео**, а не по топ-1.

Ніша де top-1 = 0.9, median = 0.3 → слабша за нішу де top-1 = 0.7, median = 0.65.

---

## Filters (Пороги для скорингу)

З `thresholds` у `viral-factory.config.yaml`:

| Поле | Дефолт | Що фільтрує |
|---|---|---|
| `min_views` | 50,000 | Мінімум переглядів для включення у вибірку |
| `min_comments` | 1,000 | Мінімум коментарів для глибокого аналізу comment-miner |
| `min_outlier` | 10 | Попередження якщо OutlierScore < цього значення |

Якщо жодне відео не перевищує `min_outlier` — попередити користувача: ніша може бути слабкою.

---

## Calibration Notes

Ваги — стартові, калібрувати після першого реального прогону:
- Якщо Shop-дані недоступні → знизити Monetization вагу, підвищити OutlierScore
- Якщо ніша B2B (мало коментарів) → знизити PainDensity вагу
- Якщо аналізуємо Instagram Reels → saves важливіші, shares менш релевантні
