/**
 * score.ts
 *
 * Computes OutlierScore and NicheScore for each video in a raw collection.
 * All component scores are min-max normalized within the batch.
 *
 * Usage:
 *   npx ts-node scripts/score.ts \
 *     --input artifacts/viral-factory/raw/watchover.json \
 *     --output artifacts/viral-factory/scored/watchover.json \
 *     --shop-data artifacts/viral-factory/raw/watchover-shop.json
 *
 * NicheScore = 0.35×Monetization + 0.25×OutlierScore_norm
 *            + 0.20×SaveShareRate_norm + 0.10×Velocity_norm + 0.10×PainDensity
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
  video_file_path?: string | null;
  author_median_views: number;
  transcript?: string | null;
  comments?: string[] | null;
  scraped_at: string;
}

export interface ScoredRecord extends CollectionRecord {
  outlier_score: number;
  outlier_score_norm: number;
  save_share_rate: number;
  save_share_rate_norm: number;
  velocity: number;
  velocity_norm: number;
  pain_density: number;
  monetization: number;
  niche_score: number;
}

export interface TikTokShopProduct {
  product_name: string;
  category: string;
  monthly_revenue: number;
  units: number;
  top_videos: Array<{ url: string; revenue: number; views: number }>;
}

interface ScoreArgs {
  input: string;
  output: string;
  shopData?: string;
  defaultPainDensity?: number;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): ScoreArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  return {
    input: get("--input") ?? "",
    output: get("--output") ?? "",
    shopData: get("--shop-data"),
    defaultPainDensity: parseFloat(get("--default-pain-density") ?? "0.5"),
  };
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const posted = new Date(isoDate).getTime();
  const now = Date.now();
  const days = (now - posted) / (1000 * 60 * 60 * 24);
  return Math.max(days, 0.5);
}

function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

// ─── Monetization ─────────────────────────────────────────────────────────────

function monetizationScore(shopProducts: TikTokShopProduct[]): number {
  if (!shopProducts || shopProducts.length === 0) return 0.3;
  const maxRevenue = Math.max(...shopProducts.map((p) => p.monthly_revenue));
  if (maxRevenue >= 200_000) return 0.9;
  if (maxRevenue >= 50_000) return 0.6;
  if (maxRevenue >= 10_000) return 0.3;
  return 0.1;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreRecords(
  records: CollectionRecord[],
  shopProducts: TikTokShopProduct[],
  defaultPainDensity = 0.5
): ScoredRecord[] {
  const monetization = monetizationScore(shopProducts);

  const rawOutlier = records.map((r) =>
    r.author_median_views > 0 ? r.views / r.author_median_views : 1
  );
  const rawSaveShare = records.map((r) =>
    r.views > 0 ? (r.saves + r.shares) / r.views : 0
  );
  const rawVelocity = records.map((r) =>
    r.views / daysSince(r.posted_at)
  );

  const normOutlier = minMaxNormalize(rawOutlier);
  const normSaveShare = minMaxNormalize(rawSaveShare);
  const normVelocity = minMaxNormalize(rawVelocity);

  return records.map((record, i) => {
    const nicheScore =
      0.35 * monetization +
      0.25 * normOutlier[i] +
      0.20 * normSaveShare[i] +
      0.10 * normVelocity[i] +
      0.10 * defaultPainDensity;

    return {
      ...record,
      outlier_score: rawOutlier[i],
      outlier_score_norm: normOutlier[i],
      save_share_rate: rawSaveShare[i],
      save_share_rate_norm: normSaveShare[i],
      velocity: rawVelocity[i],
      velocity_norm: normVelocity[i],
      pain_density: defaultPainDensity,
      monetization,
      niche_score: Math.min(nicheScore, 1),
    };
  });
}

/** Update pain_density after comment-miner results arrive and recompute NicheScore. */
export function updatePainDensity(
  scoredRecords: ScoredRecord[],
  painDensityMap: Record<string, number>
): ScoredRecord[] {
  return scoredRecords.map((record) => {
    const pd = painDensityMap[record.video_id] ?? record.pain_density;
    const nicheScore =
      0.35 * record.monetization +
      0.25 * record.outlier_score_norm +
      0.20 * record.save_share_rate_norm +
      0.10 * record.velocity_norm +
      0.10 * pd;

    return { ...record, pain_density: pd, niche_score: Math.min(nicheScore, 1) };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  if (!args.input || !args.output) {
    console.error(
      "Usage: score.ts --input <path> --output <path> [--shop-data <path>] [--default-pain-density <0-1>]"
    );
    process.exit(1);
  }

  if (!fs.existsSync(args.input)) {
    console.error(`Input file not found: ${args.input}`);
    process.exit(1);
  }

  const records: CollectionRecord[] = JSON.parse(
    fs.readFileSync(args.input, "utf-8")
  );

  let shopProducts: TikTokShopProduct[] = [];
  if (args.shopData && fs.existsSync(args.shopData)) {
    shopProducts = JSON.parse(fs.readFileSync(args.shopData, "utf-8"));
    console.log(`Loaded ${shopProducts.length} TikTok Shop products`);
  } else {
    console.log("No shop data — using default Monetization score 0.3");
  }

  console.log(`Scoring ${records.length} videos...`);
  const scored = scoreRecords(records, shopProducts, args.defaultPainDensity);
  const sorted = [...scored].sort((a, b) => b.niche_score - a.niche_score);

  const dir = path.dirname(args.output);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(sorted, null, 2), "utf-8");

  const top = sorted[0];
  console.log(`Done. ${sorted.length} videos scored.`);
  console.log(`Top NicheScore: ${top?.niche_score.toFixed(3)} (${top?.url})`);
  console.log(
    `Top OutlierScore: ${top?.outlier_score.toFixed(1)}x (min_outlier check: ${
      sorted.filter((r) => r.outlier_score >= 10).length
    } videos pass ×10 threshold)`
  );
  console.log(`Output: ${args.output}`);
}

main();
