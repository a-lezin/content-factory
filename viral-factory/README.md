# viral-factory

Портативний плагін Claude Code для пошуку продуктових ідей через аналіз вірального відеоконтенту.

**Принцип:** Content-Market Fit перед Product-Market Fit. Спершу знаходимо вірусний формат — потім вбудовуємо продукт у нього.

## Підключення в репозиторій продукту

### 1. Додати як git submodule

```bash
git submodule add https://github.com/your-org/viral-factory .claude/plugins/viral-factory
```

### 2. Зареєструвати в `.claude/settings.json`

```json
{
  "plugins": [
    ".claude/plugins/viral-factory"
  ]
}
```

### 3. Створити `viral-factory.config.yaml` в корені репо

Скопіюйте `viral-factory.config.yaml` з цього плагіна і заповніть під свій продукт:

```yaml
niche:
  slug: my-product
  keywords: ["your keywords here"]
  accounts: ["@competitor1"]
  shop_queries: ["your shop queries"]

thresholds:
  min_views: 50000
  min_comments: 1000
  min_outlier: 10

product:
  name: MyProduct
  slug: my-product
  one_demo_feature: "..."
  brand_voice: "..."
  screen_record_path: "assets/demo.mp4"

audience:
  portrait: "..."
  slang: []
```

## Скіли

| Скіл | Тригер | Що робить |
|---|---|---|
| `/discover-niche` | "знайди нішу", "discover niche" | Scrape → Score → Аналіз → Звіт по ніші |
| `/decompose-video` | "розбери відео", "decompose video" | Декомпозиція вірального відео в шаблон |
| `/spec-from-niche` | "зроби spec", "product brief" | Ніша → Продуктовий бриф |
| `/recreate-video` | "згенеруй відео", "recreate video" | Шаблон + продукт → Скрипт + відео |

## Порядок роботи

```
/discover-niche  →  /decompose-video  →  /spec-from-niche  →  /recreate-video
     ↑                                                               ↓
  TikTok data                                               Higgsfield video
```

## Вимоги

- **Apify MCP** — підключений для скрапінгу TikTok
- **Higgsfield MCP** — підключений для генерації відео та прогнозу віральності
- **Node.js 18+** — для TypeScript-скриптів (`npx ts-node`)
- **yt-dlp** — для завантаження відео
- **Whisper** (`faster-whisper`) — для транскрипції

## Артефакти

Всі результати зберігаються в `artifacts/viral-factory/` репозиторію продукту:

```
artifacts/viral-factory/
  raw/          # сирі JSON з Apify
  scored/       # відео з NicheScore
  extractions/  # результати video-analyst
  comments/     # результати comment-miner
  clusters/     # кластери болю
  niches/       # звіти по нішах
  specs/        # продуктові брифи
  scripts/      # відео-скрипти
```

## Теорія

Детальний опис методу — у [reference/method.md](reference/method.md).
Формула скорингу — у [reference/scoring.md](reference/scoring.md).
