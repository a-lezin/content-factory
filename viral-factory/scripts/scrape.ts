/**
 * scrape.ts
 *
 * Collects TikTok videos for a niche via Apify MCP, then downloads and
 * transcribes the top-N videos with yt-dlp + Whisper.
 *
 * This script is called by Claude Code as part of the /discover-niche skill.
 * The actual Apify MCP calls are delegated to Claude Code's tool runner
 * (Claude invokes the Apify MCP tool and passes results here).
 * The download/transcribe steps use the bash tool within Claude Code.
 *
 * Usage (called by Claude Code skill, not directly):
 *   npx ts-node scripts/scrape.ts \
 *     --slug watchover \
 *     --keywords "how to track my kid,screen time fight" \
 *     --accounts "@competitor1,@competitor2" \
 *     --shop-queries "parental control,family safety" \
 *     --min-views 50000 \
 *     --min-comments 1000 \
 *     --top-n 50 \
 *     --output artifacts/viral-factory/raw/watchover.json \
 *     --shop-output artifacts/viral-factory/raw/watchover-shop.json
 *
 * Output: CollectionRecord[] JSON (see schemas/collection.json)
 *         TikTokShopProduct[] JSON (see schemas/tiktok-shop.json)
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CollectionRecord {
  video_id: string;
  platform: "tiktok" | "reels";
  url: string;
  author: string;
  author_url: string;
  posted_at: string;
  duration_sec: number;
  views: number;
  likes: number;
  comments_count: number;
  shares: number;
  saves: number;
  caption: string;
  hashtags: string[];
  sound_id: string | null;
  sound_is_trending: boolean;
  video_file_url: string | null;
  video_file_path: string | null;
  author_median_views: number;
  transcript: string | null;
  comments: string[] | null;
  scraped_at: string;
}

export interface TikTokShopProduct {
  product_name: string;
  category: string;
  monthly_revenue: number;
  units: number;
  top_videos: Array<{ url: string; revenue: number; views: number }>;
  data_source: string;
}

interface ScrapeArgs {
  slug: string;
  keywords: string[];
  accounts: string[];
  shopQueries: string[];
  minViews: number;
  minComments: number;
  topN: number;
  output: string;
  shopOutput: string;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): ScrapeArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const slug = get("--slug") ?? "unknown";

  return {
    slug,
    keywords: (get("--keywords") ?? "").split(",").filter(Boolean),
    accounts: (get("--accounts") ?? "").split(",").filter(Boolean),
    shopQueries: (get("--shop-queries") ?? "").split(",").filter(Boolean),
    minViews: parseInt(get("--min-views") ?? "50000", 10),
    minComments: parseInt(get("--min-comments") ?? "1000", 10),
    topN: parseInt(get("--top-n") ?? "50", 10),
    output: get("--output") ?? `artifacts/viral-factory/raw/${slug}.json`,
    shopOutput:
      get("--shop-output") ?? `artifacts/viral-factory/raw/${slug}-shop.json`,
  };
}

// ─── Apify MCP Contract ───────────────────────────────────────────────────────
//
// Claude Code invokes Apify MCP directly. This function documents the expected
// input/output contract so Claude knows what to pass and what to expect back.
//
// Actor: apify/tiktok-scraper (or apify/tiktok-hashtag-scraper for keyword search)
//
// Input (Claude passes to Apify MCP):
//   {
//     searchQueries: string[],    // keywords
//     profiles: string[],         // @handles
//     maxItems: 200,
//     resultsType: "posts",
//     minVideoViews: number
//   }
//
// Output (Apify returns to Claude, Claude maps to CollectionRecord):
//   Array of TikTok post objects with: id, webVideoUrl, authorMeta,
//   createTime, playCount, diggCount, commentCount, shareCount, collectCount,
//   text, hashtags, musicMeta, videoMeta
//
// Author median views: separate Apify call to author's profile page
//   apify/tiktok-profile-scraper with { profiles: [handle], maxItems: 20 }
//   Then compute median of playCount across results.
//
// Comments: apify/tiktok-comments-scraper
//   { postUrls: [url], maxItems: 500 }
//
// TikTok Shop: apify/tiktok-shop-scraper
//   { searchQuery: string, maxItems: 20 }

export function mapApifyResponseToCollection(
  apifyItem: Record<string, unknown>,
  authorMedianViews: number,
  platform: "tiktok" | "reels" = "tiktok"
): CollectionRecord {
  return {
    video_id: String(apifyItem["id"] ?? apifyItem["videoId"] ?? ""),
    platform,
    url: String(apifyItem["webVideoUrl"] ?? apifyItem["url"] ?? ""),
    author: String(
      (apifyItem["authorMeta"] as Record<string, unknown>)?.["name"] ??
        apifyItem["author"] ??
        ""
    ),
    author_url: String(
      (apifyItem["authorMeta"] as Record<string, unknown>)?.["profileUrl"] ?? ""
    ),
    posted_at: new Date(
      Number(apifyItem["createTime"] ?? 0) * 1000
    ).toISOString(),
    duration_sec: Number(
      (apifyItem["videoMeta"] as Record<string, unknown>)?.["duration"] ?? 0
    ),
    views: Number(apifyItem["playCount"] ?? 0),
    likes: Number(apifyItem["diggCount"] ?? 0),
    comments_count: Number(apifyItem["commentCount"] ?? 0),
    shares: Number(apifyItem["shareCount"] ?? 0),
    saves: Number(apifyItem["collectCount"] ?? 0),
    caption: String(apifyItem["text"] ?? ""),
    hashtags: (
      (apifyItem["hashtags"] as Array<Record<string, string>>) ?? []
    ).map((h) => h["name"] ?? ""),
    sound_id: String(
      (apifyItem["musicMeta"] as Record<string, unknown>)?.["musicId"] ?? ""
    ) || null,
    sound_is_trending: Boolean(
      (apifyItem["musicMeta"] as Record<string, unknown>)?.["isTrending"]
    ),
    video_file_url: String(
      (apifyItem["videoMeta"] as Record<string, unknown>)?.["downloadAddr"] ?? ""
    ) || null,
    video_file_path: null,
    author_median_views: authorMedianViews,
    transcript: null,
    comments: null,
    scraped_at: new Date().toISOString(),
  };
}

// ─── yt-dlp + Whisper commands ────────────────────────────────────────────────
//
// Claude Code executes these via the bash tool.
// The skill SKILL.md documents this; the script provides the command strings.

export function ytDlpCommand(
  url: string,
  outputPath: string
): string {
  return `yt-dlp -o "${outputPath}" --no-playlist --quiet "${url}"`;
}

export function whisperCommand(
  videoPath: string,
  outputDir: string
): string {
  return `whisper "${videoPath}" --model base --output_format json --output_dir "${outputDir}" --word_timestamps True`;
}

// ─── Output helpers ───────────────────────────────────────────────────────────

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeRecords(records: CollectionRecord[], outputPath: string): void {
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf-8");
  console.log(`Wrote ${records.length} records to ${outputPath}`);
}

export function writeShopData(
  products: TikTokShopProduct[],
  outputPath: string
): void {
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");
  console.log(`Wrote ${products.length} Shop products to ${outputPath}`);
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

export function filterByViews(
  records: CollectionRecord[],
  minViews: number
): CollectionRecord[] {
  return records.filter((r) => r.views >= minViews);
}

export function topByViews(
  records: CollectionRecord[],
  n: number
): CollectionRecord[] {
  return [...records].sort((a, b) => b.views - a.views).slice(0, n);
}

// ─── Main (prints usage guide for Claude Code) ────────────────────────────────

function main(): void {
  const args = parseArgs();

  console.log("=== scrape.ts: Apify MCP + yt-dlp + Whisper pipeline ===");
  console.log("");
  console.log("This script is orchestrated by Claude Code. Steps:");
  console.log("");
  console.log("Step 1: Claude calls Apify MCP tool with:");
  console.log("  Actor: apify/tiktok-scraper");
  console.log("  Keywords:", args.keywords);
  console.log("  Accounts:", args.accounts);
  console.log("  Min views:", args.minViews);
  console.log("  Output stored at:", args.output);
  console.log("");
  console.log("Step 2: Claude calls Apify MCP for author median views");
  console.log("  Actor: apify/tiktok-profile-scraper");
  console.log("  For each unique author handle in the results");
  console.log("");
  console.log("Step 3: Claude calls Apify MCP for comments");
  console.log("  Actor: apify/tiktok-comments-scraper");
  console.log("  For videos with comments_count >=", args.minComments);
  console.log("");
  console.log(`Step 4: Claude downloads top ${args.topN} videos:`);
  console.log("  Command: yt-dlp -o /tmp/viral-factory/{video_id}.%(ext)s {url}");
  console.log("");
  console.log("Step 5: Claude transcribes with Whisper:");
  console.log("  Command: whisper {path} --model base --output_format json --word_timestamps True");
  console.log("");
  console.log("Step 6 (if shop-queries set): Claude calls Apify MCP for TikTok Shop:");
  console.log("  Queries:", args.shopQueries);
  console.log("  Shop output:", args.shopOutput);
  console.log("");
  console.log("After all Apify calls complete, Claude merges results into");
  console.log("CollectionRecord[] and writes to:", args.output);
  console.log("");
  console.log("Reference: scripts/schemas/collection.json, scripts/schemas/tiktok-shop.json");
}

main();

export { parseArgs };
