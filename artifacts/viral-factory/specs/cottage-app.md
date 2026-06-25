# Product Spec: Cottage App (назва TBD)
Generated: 2026-06-23
Source niche: cottage-rental
Niche report: artifacts/viral-factory/niches/cottage-rental.md

---

## One-line positioning

Cottage App is the listing + direct booking tool for solo cottage owners who hate paying Airbnb 15% — it writes your listing from one photo and gives guests a way to book you directly.

---

## Primary pain

> *"As an AirBnb owner, please rent direct! We hate AirBnb as much as you do!"*

**Cluster: Airbnb fees / direct booking**
Frequency: топ-коментарі у 3/5 відео | Commercial intent score: 0.9
Verbatim signal: *"We would literally prefer yall book direct — I match the price without the Airbnb fees"* (4437 ліків)

Суть болю: solo operator здає котедж через Airbnb тому що не знає як інакше. Airbnb бере 3% від власника + ~15% від гостя = $180+ з кожного бронювання. Власники знають що це занадто, але альтернативи "просто налаштувати" — не існує. Вони вже мають Instagram-сторінку для прямих бронювань — але це ручний хаос.

---

## One-demo feature

**Що відбувається на екрані (30 секунд):**

Власник відкриває апп на телефоні. Натискає "Створити лістинг". Фотографує вхідні двері котеджу — один знімок. Через 8 секунд екран заповнюється: заголовок Airbnb, опис на 3 абзаци, 5 хештегів, suggested price. Далі — кнопка "Також створити сторінку прямого бронювання". Ще 3 секунди — і є посилання типу `yourname.cottage.app` яке можна вставити в Airbnb bio. Власник показує обличчя з виразом "seriously?!".

**Чому це sticky:**
- Візуально: трансформація "порожній екран → готовий лістинг" за 8 секунд
- Негайно: жодного онбордингу, перший результат до кінця відео
- Sticky: глядач думає "а скільки часу я витратив на свій лістинг вручну"

**Вимоги до реалізації:** multimodal vision model (фото → структурований текст), шаблонний движок для Airbnb-формату, subdomain routing для direct booking pages.

---

## Positioning statement

"Cottage App — це інструмент лістингу та прямих бронювань для власників одного котеджу, яким набридло платити Airbnb 15% з кожного гостя. На відміну від Hostaway чи Guesty (дорогі, для property managers), він пише ваш перший лістинг за одне фото і дає гостям посилання щоб забронювати напряму."

*(38 слів)*

---

## Pricing signal

**Рекомендація:** $19/місяць — freemium, hard paywall на direct booking page.

**Логіка:**
- Airbnb комісія з власника = ~3% від бронювання. При середньому бронюванні $600 (3 ночі × $200) = $18 комісія до Airbnb. **Одне пряме бронювання на місяць = апп окупився.**
- Freemium: генерація лістингу безкоштовно (viral hook — люди ділитимуться результатом). Paywall: direct booking сторінка + calendar sync + analytics.
- Конкуренти: Guesty from $99/міс (для property managers, 10+ об'єктів). Hostaway: ~$100/міс. Lodgify: $13–$73/міс (найближчий конкурент за ціною).
- **Наша ніша**: solo operator з 1–2 об'єктами, якому $13–20/міс — звична підписка.

**Uncertainty:** medium — немає TikTok Shop даних для прямого benchmarking. Запустити price-sensitivity тест: $9 vs $19 vs $29/місяць в першому спринті відео.

---

## Brand voice

**Тон:** Solo operator to solo operator. Ти не компанія — ти такий самий власник що знайшов спосіб. Говориш як людина що "знайшла лайфхак після болю", не як SaaS-продукт.

**Словник:** конкретні числа завжди ("$180 комісії", "8 секунд", "3 бронювання"), слова аудиторії без перекладу ("STR", "direct booking", "solo operator", "cleaning fee", "superhost"), жодного corporate speak ("streamline", "leverage", "optimize").

**Що уникати:** не асоціюватись з "корпоративним інвестором що скупив 79 квартир" (топ-коментар з 4507 ліків: *"good for Dallas"* — реакція на заборону масових STR). Завжди підкреслювати: один котедж, один власник, перша нерухомість.

---

## Top 5 hooks для тестування (ranked)

**Критерій ранжування:** +2 за пряму назву болю, +2 за verbatim мову аудиторії, +1 за <10 слів, +1 за transformation framing.

1. *"Власники Airbnb ненавидять Airbnb так само, як ви — ось що вони хочуть натомість"*
   — Score: 6/6 | [source: коментар 1118 ліків @takidaddi, verbatim "We hate AirBnb as much as you do"]
   — Framing: reveals shared enemy, creates alliance

2. *"Я сфотографував свій котедж → апп написав лістинг → 3 бронювання за тиждень"*
   — Score: 5/6 | [source: one-demo feature, transformation framing]
   — Framing: before/after з конкретним результатом

3. *"Скільки Airbnb бере з вас насправді — і як отримати ці гроші назад"*
   — Score: 5/6 | [source: pain cluster #1, commercial intent 0.9]
   — Framing: loss aversion ("ці гроші ваші, не їхні")

4. *"4 зміни в лістингу що подвоюють бронювання — перевірила на своєму котеджі"*
   — Score: 4/6 | [source: tips format @jorpham 67k views, save-rate signal]
   — Framing: listicle + personal proof

5. *"Зарплата за серпень: $X з одного котеджу — реальні цифри після витрат"*
   — Score: 4/6 | [source: income reveal format @aboutaysha 1.99M views, pain cluster #2]
   — Framing: income reveal, відповідь на "але скільки реально?"

---

## Video formats для реплікації

1. **hack/reveal** — Hook #1 або #3. Структура: проблема (15% комісія) → hack (direct booking link) → демо апп → CTA "посилання в bio".
   - Приклад: [@takidaddi/7542576811692117261](https://www.tiktok.com/@takidaddi/video/7542576811692117261) | Template: run `/decompose-video` на цьому URL

2. **income reveal** — Hook #5. Структура: число на екрані → breakdown (gross vs net) → "апп зекономив мені $X у прямих бронюваннях" → CTA.
   - Приклад: [@aboutaysha/7340022467227880747](https://www.tiktok.com/@aboutaysha/video/7340022467227880747) | Template: run `/decompose-video`

3. **tips listicle / save-this** — Hook #4. Структура: text overlay list → screen recording апп → CTA "save + спробуй безкоштовно".
   - Приклад: [@jorpham/7503468501731003666](https://www.tiktok.com/@jorpham/video/7503468501731003666) | Template: run `/decompose-video`

---

## Audience portrait

Solo operators — власники 1–2 котеджів у туристичних локаціях (гори, узбережжя, містечка типу Gatlinburg). Переважно жінки 28–42, куплена нерухомість в іпотеку або перша інвестиція. Здають самостійно без property manager. Роздратовані що Airbnb забирає 15%+, але ще більше роздратовані що не знають як без нього. Вже мають Instagram-сторінку для прямих бронювань — але ведуть її вручну, без системи.

Паралельна аудиторія: 18–25, хочуть "почати з нерухомості", немає капіталу, дивляться контент для натхнення. Висока залученість, нижча платоспроможність — підходять для top-of-funnel контенту але не core user.

**Слова що використовують:** "STR", "direct booking", "solo operator", "cleaning fee", "check-out chore list", "superhost", "getting your bag", "host life", "Gatlinburg cabin", "vacation rental", "occupancy rate".

---

## Open questions

1. **Direct booking ToS:** Airbnb явно забороняє перенаправлення гостей на зовнішні сайти через платформу. Юридична консультація обов'язкова до лончу. Можливий обхід: direct booking page не рекламується всередині Airbnb, а через наш власний контент (TikTok/Instagram).
2. **App Store:** Чи потрібен мобільний апп з першого дня, або достатньо web app? Web MVP дешевший і швидший, але "фотографуєш з телефону" — потребує нативного апп або PWA.
3. **AI listing quality:** GPT-4o Vision або Gemini 2.5 для фото → текст. Тест: чи генерований текст проходить Airbnb filters (не спамить ключові слова)?
4. **Конкуренти що не з'явились у скрейпінгу:** Lodgify, Hostfully, OwnerRez — перевірити чи мають TikTok-присутність і яку.
5. **Ціна vs value:** $19/міс = одне пряме бронювання = окупився. Але чи розуміє solo operator цю математику? Перший онбординг має показати калькулятор.

---

## Recommended next step

Запустити `/decompose-video` на [@takidaddi/7542576811692117261](https://www.tiktok.com/@takidaddi/video/7542576811692117261) — витягнути шаблон hack/reveal формату, потім `/recreate-video` з Hook #1 і цим шаблоном.

Перший відео-тест: hack/reveal з Hook #1 → показує біль (Airbnb fee) → демо апп (photo → listing за 8 сек) → direct booking link → CTA "безкоштовно в bio".
