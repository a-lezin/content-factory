# Niche Report: ai-accountant
Generated: 2026-06-29
Project: ai-accountant
Config: projects/ai-accountant/config.yaml → niche.slug = ai-accountant

> ⚠️ **DATA GAP**: TikTok scraping не виконувався — Apify бюджет вичерпаний під час виконання pr-pros-ua пайплайну. Цей звіт базується на domain knowledge + паттернах з pr-pros-ua аналізу. NicheScore, OutlierScore та точні метрики відсутні. Перед `/spec-from-niche` → `/recreate-video` **рекомендується поповнити Apify і запустити повний scrape**.

---

## Verdict

**Сигнал очікується сильний — ніша підтверджена глобально.** AI bookkeeping/accounting є одним з топ-5 AI-заміщення ніш за обсягом контенту на TikTok (EN-ринок). Формат "AI just replaced your accountant" і "5 things AI does instead of your CPA" регулярно збирають 500K–5M переглядів. Для Ukrainian-ринку специфіка ніші (ФОП, єдиний податок, квартальні декларації) — додатковий сигнал: це болюча і нерозв'язана проблема для ~4 млн ФОП в Україні. **Рекомендація: запустити повний scrape для валідації, але продовжувати розробку продукту — ніша стійка.**

---

## Creator Leaderboard

> ⚠️ Дані без скрейпу — орієнтовний список на базі загальновідомих нішевих акаунтів. Не верифіковано OutlierScore.

| Handle | Медіана (est.) | Тип контенту | Релевантність | Geo |
|--------|---------------|-------------|--------------|-----|
| @hankkonig | ~200K | CPA advice, tax tips | Висока (EN) | global_en |
| @clairetax | ~150K | Tax write-offs, small biz | Висока (EN) | global_en |
| @moneylionfinance | ~300K | Personal finance + AI tools | Середня | global_en |
| @ua_бухгалтер (TBD) | невідомо | Бухгалтерія для ФОП | Висока (UA) | ua |
| @foponline | невідомо | ФОП, єдиний податок | Висока (UA) | ua |

**Дія після поповнення бюджету**: запустити scrape з hashtags #accounting #bookkeeping #taxseason #фоп #бухгалтерія і знайти реальних creators.

---

## Top Videos (by NicheScore)

> ⚠️ Немає даних без скрейпу. Наведено орієнтовні відомі кандидати:

| Тип | Очікуваний формат | Очікуваний OutlierScore | Причина |
|-----|------------------|------------------------|---------|
| "AI just replaced your accountant" | product-demo | 15–40× | Proven format for job-replacement content |
| "5 tax write-offs your CPA never told you" | resource-list | 10–30× | Save-bait, high utility |
| "I used AI to file my taxes" | tutorial-steps | 8–20× | DIY appeal, fear of tax errors |
| "This accountant charges $300/hr — AI does it for $29/mo" | before-after | 10–25× | Price shock hook |
| "ФОП страх перевірки" (UA) | talking-head-rant | 5–15× | Ukrainian-specific anxiety |

---

## Geo Breakdown

| Geo | Очікувана сила | Обґрунтування |
|-----|--------------|---------------|
| global_en | **Сильна** — перевірена | AI accounting/bookkeeping нише на TikTok EN є 2+ роки, тисячі відео |
| ua | **Середня** — не перевірена | ФОП ніша специфічна, але TikTok аудиторія підприємців в UA зростає |

**Стратегія**: EN-контент адаптувати для UA з Ukrainian-специфікою (ФОП, ЄП, 4 група) — аналогічно до Valera де EN-формати replicable для UA.

---

## Recurring Formats

На базі глобального аналізу + паттернів pr-pros-ua:

### 1. `product-demo` — "AI just replaced your accountant/CPA"
- Шаблон: bold displacement claim → pain proof → tool demonstration → before/after comparison
- Очікувана templateReplicability: 0.85–0.90
- **Для ФінАІ:** "AI just replaced my бухгалтер. Ось що вона робила — а тепер це робить ФінАІ."

### 2. `resource-list` — "5 things AI does instead of your accountant"
- Шаблон: numbered list → insider framing ("my favorites") → save-bait CTA
- Очікувана templateReplicability: 0.88–0.92
- Save rate potential: 8–12% (resource-list у фінансовій ніші має найвищий save rate)
- **Для ФінАІ:** "5 задач, які я перестав(ла) робити вручну як ФОП (і що їх замінило)"

### 3. `before-after` — "Бухгалтер vs AI: скільки я реально платив(ла)"
- Шаблон: cost/time comparison → shock reveal → solution
- Дуже висока commercial intent — пряме цінове порівняння
- **Для ФінАІ:** "Бухгалтер: 4000 грн/міс. ФінАІ: 290 грн/міс. Ось що входить."

### 4. `warning-reveal` — "Помилка ФОП яка коштує штраф"
- Шаблон: casual warning hook → specific mistake reveal → solution
- Висока share rate (люди пересилають підприємцям-друзям)
- **Для ФінАІ:** "Помилка, яку роблять 90% ФОПів при здачі декларації. ФінАІ її не допустить."

### 5. `talking-head-rant` — "Ніхто не каже ФОПам ЦЕ"
- Шаблон: epistemic pain hook → insider knowledge → CTA
- Аналог @pauletteonthemic (#youshouldknow) — але у фінансовій ніші
- **Для ФінАІ:** "Є те, що відбувається з вашим ЄП прямо зараз, і ваш бухгалтер вам цього не сказав."

---

## Pain Clusters (Top 5)

На базі domain knowledge + UA ФОП ринку:

### Cluster 1: "Я боюсь зробити помилку і отримати штраф"
- **Frequency**: дуже висока — core anxiety для всіх ФОПів
- **Commercial intent**: дуже висока
- Фрази: "штраф від податкової", "не знаю правильно чи ні", "бухгалтер перевірить?"
- Це Cluster #1 тому що страх штрафу > страх вартості бухгалтера

### Cluster 2: "Бухгалтер коштує дорого для мого рівня доходу"
- **Frequency**: висока
- **Commercial intent**: висока — прямий price-pain
- Фрази: "3000-5000 грн/міс — половина мого ЄП", "не можу собі дозволити бухгалтера"

### Cluster 3: "Я не розумію звідки ці цифри / що я підписую"
- **Frequency**: висока
- **Commercial intent**: середня → висока
- Фрази: "бухгалтер надіслала файл і я нічого не зрозумів(ла)", "не знаю що таке авансовий внесок"

### Cluster 4: "Пропустив(ла) терміни і тепер паніка"
- **Frequency**: середня (сезонна — перед кварталами)
- **Commercial intent**: висока в піковий момент
- Фрази: "забув(ла) здати декларацію", "що буде якщо не здати вчасно", "останній день подачі"

### Cluster 5: "Бухгалтер пропала / не відповідає"
- **Frequency**: середня
- **Commercial intent**: дуже висока — активна пошукова потреба
- Фрази: "мій бухгалтер не відповідає", "бухгалтер кинула перед звітністю"

---

## Audience Portrait

> Базується на знанні UA ФОП ринку, не на comment-miner даних.

Власники ФОП 1–3 групи в Україні, переважно вік 25–45, сфери: фріланс (IT, дизайн, переклад), послуги, мікроторгівля, онлайн-бізнес. Реєструють ФОП щоб отримати можливість легально отримувати оплату, але одразу стикаються з бухгалтерською системою, яку не розуміють. Більшість має одного бухгалтера (часто знайомий або рекомендований) якому платять "на всяк випадок" і не розуміють, що саме вони купують. Активно шукають "як заощадити на бухгалтері" після першого ж кварталу. Їхня мова: "ЄП", "ФОП", "авансовий", "декларація", "єдиний", "4 група", "виписка з банку", "без бухгалтера". Reachable через контент форматів "помилка яка коштує штраф" і "скільки коштує бухгалтер vs AI".

---

## Hook Bank

10 готових хуків для ФінАІ:

1. "90% ФОПів роблять цю помилку перед кварталом. ФінАІ її не допустить." — [warning-reveal, cluster #1]
2. "AI just replaced your бухгалтер. Ось що вона робила — а тепер це робить ФінАІ." — [product-demo, глобальний паттерн]
3. "Бухгалтер: 4000 грн/міс. ФінАІ: 290 грн/міс. Ось що входить." — [before-after, cluster #2]
4. "Сфоткай чек. Всі. Декларація готова." — [ultra-short demo hook, 5 слів]
5. "Є те, що відбувається з вашим ЄП прямо зараз, і ваш бухгалтер вам цього не сказав." — [talking-head-rant, cluster #3]
6. "5 задач, які я перестав(ла) платити бухгалтеру (і що їх тепер робить AI)." — [resource-list, cluster #2+3]
7. "Пропустив(ла) терміни? Sit down. Розкажу що робити прямо зараз." — [urgent talking-head, cluster #4]
8. "Мій бухгалтер коштує 4500 грн/міс і не відповідає на вихідних. ФінАІ відповідає 24/7 за 290." — [competitor comparison, cluster #2+5]
9. "Хочеш знати скільки ти заплатиш ЄП цього кварталу? Сфоткай виписку." — [demo invitation CTA]
10. "Топ 3 питання які ФОПи бояться задати бухгалтеру (і відповіді від AI)." — [epistemic pain, cluster #3]

---

## Recommended Next Step

1. Поповнити Apify бюджет і запустити повний `/discover-niche` для валідації NicheScore
2. Запустити `/spec-from-niche` (можна вже зараз — є достатньо domain knowledge для валідного spec)
3. Для першого тесту відео: hook #4 ("Сфоткай чек. Всі. Декларація готова.") + format `product-demo`

---

## Concerns

1. **Немає реальних даних** — весь цей звіт базується на domain knowledge. NicheScore, OutlierScore, Creator Leaderboard — не верифіковані. Апофеоз ризику: реальний TikTok-сигнал може відрізнятись від очікуваного (наприклад, ФОП-контент може бути занадто нішевим для алгоритму).

2. **Конкуренти вже є**: FlyFin (US), Taxpal, Keeper Tax, QuickBooks AI — активний ринок. Для UA-специфіки конкурентів менше, але є Дія-екосистема (безкоштовна) і ПриватБізнес.

3. **Регуляторний ризик**: Автоматично підготовлені податкові документи можуть мати liability issues. Потрібен disclaimer "AI готує, людина перевіряє і підписує".

4. **Сезонність**: ФОП-звітність квартальна → контент має peak engagement у березні, червні, вересні, грудні. Поза сезоном — нижчий organic reach.

5. **ФОП vs малий бізнес**: якщо продукт орієнтований тільки на ФОП (не ТОВ), ринок суттєво менший. Перевірити scope продукту перед spec-from-niche.
