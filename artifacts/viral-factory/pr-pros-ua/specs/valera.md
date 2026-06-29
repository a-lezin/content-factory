# Product Spec: Valera
Generated: 2026-06-29
Project: pr-pros-ua
Source niche: pr-pros-ua
Niche report: artifacts/viral-factory/pr-pros-ua/niches/pr-pros-ua.md

---

## One-line positioning

Valera is the AI PR-співробітник for founders and PR-managers who cannot afford to miss a brand mention while they sleep. Unlike a full-time hire, it monitors, drafts, and pings humans only when escalation is needed — 24/7, every language, every timezone.

---

## Primary pain

**"Щось відбувається з репутацією мого бренду прямо зараз, і я про це не знаю."**

Cluster: "Щось відбувається з моїм брендом, і я про це не знаю" | Frequency: висока (2/5 відео-аналізів, + підтверджено форматами warning-reveal з 9.1M і 2.2M переглядів) | Commercial intent: дуже висока — це точний use case продукту.

Secondary pain (also addressable): "Я не можу дозволити собі PR-команду, але мені вона потрібна" — targeting solopreneurs та SMB-власників без PR-штату.

---

## One-demo feature

**Що відбувається на екрані за 30 секунд:**
Вхідне повідомлення в Slack: новий медіазапит або негативна згадка бренду з'явилась о 2:00 ночі. Valera класифікує її за 3 секунди (іконка + мітка "⚠️ Ризик репутації"), генерує чернетку відповіді/спростування укр./англ. прямо в треді і позначає: "Пінгую тебе лише тому що це виходить за межі моїх повноважень." Вранці власник відкриває телефон — все вже оброблено.

Критерій перевірки: ✅ Візуальне (Slack notification → готова чернетка), ✅ Негайне (немає onboarding у демо), ✅ Sticky ("вони хочуть це, бо вони БУЛИ в тій ситуації").

---

## Pricing signal

**Рекомендація: $29–$49/місяць**, freemium tier (3 бренди, 1 ринок) + платний tier з необмеженими брендами/мовами/інтеграціями.

Rationale: Pain density висока (тип "нічний інцидент з брендом" — прямий фінансовий ризик для клієнта), що виправдовує вищу ціну ніж mid-tier AI tool ($10–$15). TikTok Shop comp відсутній (немає даних). Аналог-орієнтир: Mention ($29/mo), Brand24 ($49/mo) — Valera позиціонується як "AI-колега", не "моніторинговий сервіс", що дозволяє брати вище.

TikTok Shop comps: немає даних (коментарі не зібрані) | Uncertainty: висока — рекомендується price test $29 vs $49 в перших 10 відео через коментарі ("link in bio" + лід-магніт).

---

## Brand voice

Valera говорить як **колега-PR-щик**, а не SaaS-тулзик — жива людська мова, конкретні цифри (24/7, 3 секунди, кожна мова), нульова корпоративна мова. Словник: "пінгує", "чернетка", "обробив", "нічна зміна", "не пропустив", "вийшло за повноваження" — це мова людини, що здала зміну. Уникати: "оптимізувати", "синергія", "leverage", "платформа для управління репутацією" — усе це відштовхує PR-аудиторію і підтверджує, що продукт "не для них".

---

## Top 5 hooks to test (ranked)

Рейтинг: назва болю (+2), verbatim мова аудиторії (+2), <10 слів (+1), трансформація (+1).

1. **"Ваш бренд щойно згадали в негативному контексті. Ніхто з вашої команди про це не знає."** *(score: 6/6)* — [джерело: warning-reveal формат, @cottage.beansoup 9.1M + hook bank #1]
2. **"AI just replaced your PR manager. Це Valera."** *(score: 5/6)* — [джерело: product-demo формат, @nathanhodgson.ai 13.4×]
3. **"Sit down. Є те, що відбувається з репутацією вашого бренду прямо зараз."** *(score: 4/6)* — [джерело: talking-head-rant, @pauletteonthemic 2.2M + hook bank #5]
4. **"PR-рутина займає 4 години на день. Після Valera — 12 хвилин."** *(score: 4/6)* — [джерело: before-after формат, hook bank #3]
5. **"Чи вбив Claude тільки-но PR-агентства? Показую 5 задач, які Valera робить замість людини."** *(score: 3/6)* — [джерело: tutorial-steps, @nocode.joshua 502K, 7.2% save rate]

---

## Video formats to replicate

1. **`warning-reveal`**: https://www.tiktok.com/@cottage.beansoup/video/7631410971675839757 | Template: run `/decompose-video` на цей URL
2. **`product-demo`** ("AI just replaced [job]"): https://www.tiktok.com/@nathanhodgson.ai/video/7494715507095145730 | Template: run `/decompose-video` на цей URL
3. **`tutorial-steps`** ("Did AI kill [industry]?"): https://www.tiktok.com/@nocode.joshua/video/7619447769673075975 | Template: run `/decompose-video` на цей URL

---

## Audience portrait

Власники бізнесу та PR-менеджери з командами до 5 осіб, які ведуть кілька брендів або клієнтів одночасно. Щодня стикаються з "нічними інцидентами" — запити від журналістів, негативні пости, кризові треди — коли немає кому реагувати. Витрачають 3–4 години на ручний моніторинг і написання рутинних чернеток. Хочуть масштабуватись без нових людей у штаті — "AI-агент замість ще одного джуна". Їхня мова: "пітч", "реліз", "фоллоу-ап", "інфопривід", "згадки", "ToV", "вигоряння", "24/7". Reachable через контент формату "AI замінює [роль]" і "що я побачив/не побачив поки спав".

---

## Open questions

1. **Технічна реалізація one-demo feature**: Slack-інтеграція потрібна "з коробки" для переконливого демо — чи є вона вже або це placeholder?
2. **Pricing validation**: Без TikTok Shop comps і comment-miner — ціновий сигнал слабкий. Тест: лід-магніт (безкоштовний тріал 14 днів) у перших 5 відео → збір email → pitch $29/mo.
3. **Конкурентне позиціонування vs Mention/Brand24**: ці інструменти вже добре відомі PR-спільноті. Valera мусить відразу пояснити різницю: "не просто моніторинг — а AI-колега, що реагує замість тебе."
4. **Мовний таргет**: UA-ринок тонкий на TikTok. Чи першочерговий ринок — EN (SaaS founders) чи UA (PR-агентства)?
5. **Юридичне**: автоматичні відповіді від імені клієнта в кризовій ситуації — є compliance/ToS ризики залежно від галузі (публічні компанії, регульовані галузі).

---

## Recommended next step

Запусти `/decompose-video` на [цей URL](https://www.tiktok.com/@nathanhodgson.ai/video/7494715507095145730) (product-demo "AI just replaced SMM") → додасть шаблон у `projects/pr-pros-ua/video-templates.md` → потім `/recreate-video` з hook #1 ("Ваш бренд щойно згадали…") і цим шаблоном для першого тестового відео Valera.
