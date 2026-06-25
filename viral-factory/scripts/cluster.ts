/**
 * cluster.ts
 *
 * Clusters pain points from video-analyst extractions and comment-miner outputs.
 * Uses Claude Opus to semantically group pain points — no separate embedding model needed.
 *
 * Usage:
 *   npx ts-node scripts/cluster.ts \
 *     --extractions artifacts/viral-factory/extractions/watchover.json \
 *     --comments artifacts/viral-factory/comments/watchover.json \
 *     --output artifacts/viral-factory/clusters/watchover.json \
 *     --n-clusters 8
 */

import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractionRecord {
  video_url: string;
  hook: string;
  structure: string[];
  format: string;
  novelty_element: string;
  product_in_frame: string | null;
  notes: string;
}

interface CommentMinerRecord {
  video_url: string;
  pain_points: string[];
  feature_requests: string[];
  commercial_intent: string[];
  pain_density_score: number;
}

export interface PainCluster {
  cluster_id: string;
  cluster_name: string;
  frequency: number;
  commercial_intent_score: number;
  representative_phrases: string[];
  source_videos: string[];
  feature_requests: string[];
}

export interface ClusterOutput {
  generated_at: string;
  total_pain_points: number;
  n_clusters_requested: number;
  clusters: PainCluster[];
}

interface PainItem {
  text: string;
  source_url: string;
  commercial_intent: boolean;
  is_feature_request: boolean;
}

interface ClusterArgs {
  extractions: string;
  comments: string;
  output: string;
  nClusters: number;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): ClusterArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  return {
    extractions: get("--extractions") ?? "",
    comments: get("--comments") ?? "",
    output: get("--output") ?? "",
    nClusters: parseInt(get("--n-clusters") ?? "8", 10),
  };
}

// ─── Clustering via Claude ────────────────────────────────────────────────────

async function clusterWithClaude(
  client: Anthropic,
  items: PainItem[],
  nClusters: number
): Promise<PainCluster[]> {
  const formatted = items
    .map(
      (p, i) =>
        `[${i}] source=${p.source_url} commercial=${p.commercial_intent} feature=${p.is_feature_request}\n    "${p.text}"`
    )
    .join("\n");

  const prompt = `You are a product researcher clustering pain points from viral video comments.

Group the ${items.length} items below into ${nClusters} meaningful clusters.
Each cluster = one distinct underlying problem or desire.

Items:
${formatted}

Rules:
- Cluster by the underlying problem, not surface wording
- Prefer fewer, denser clusters over many sparse ones
- commercial_intent=true items should weight cluster ranking higher
- feature_request=true items should be noted separately in the cluster

Respond with a JSON array only, no other text:
[
  {
    "cluster_id": "c1",
    "cluster_name": "short descriptive name (3-5 words)",
    "member_indices": [0, 3, 7],
    "commercial_intent_score": 0.0,
    "representative_phrases": ["phrase1", "phrase2", "phrase3"],
    "feature_request_indices": [3]
  }
]`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content.find((b) => b.type === "text")?.text ?? "[]";
  const json = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  interface RawCluster {
    cluster_id: string;
    cluster_name: string;
    member_indices: number[];
    commercial_intent_score: number;
    representative_phrases: string[];
    feature_request_indices?: number[];
  }

  const rawClusters: RawCluster[] = JSON.parse(json);

  return rawClusters.map((rc) => {
    const members = (rc.member_indices ?? [])
      .map((i) => items[i])
      .filter(Boolean);
    const featureRequestIndices = new Set(rc.feature_request_indices ?? []);
    const featureItems = (rc.member_indices ?? [])
      .filter((i) => featureRequestIndices.has(i))
      .map((i) => items[i]?.text)
      .filter(Boolean) as string[];

    return {
      cluster_id: rc.cluster_id,
      cluster_name: rc.cluster_name,
      frequency: members.length,
      commercial_intent_score: rc.commercial_intent_score ?? 0,
      representative_phrases: rc.representative_phrases ?? [],
      source_videos: [...new Set(members.map((m) => m.source_url))],
      feature_requests: featureItems,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.extractions || !args.comments || !args.output) {
    console.error(
      "Usage: cluster.ts --extractions <path> --comments <path> --output <path> [--n-clusters <n>]"
    );
    process.exit(1);
  }

  const extractions: ExtractionRecord[] = fs.existsSync(args.extractions)
    ? JSON.parse(fs.readFileSync(args.extractions, "utf-8"))
    : [];

  const comments: CommentMinerRecord[] = fs.existsSync(args.comments)
    ? JSON.parse(fs.readFileSync(args.comments, "utf-8"))
    : [];

  const allItems: PainItem[] = [];

  for (const c of comments) {
    const hasCommercial = c.commercial_intent?.length > 0;
    for (const pain of c.pain_points ?? []) {
      allItems.push({
        text: pain,
        source_url: c.video_url,
        commercial_intent: hasCommercial,
        is_feature_request: false,
      });
    }
    for (const feat of c.feature_requests ?? []) {
      allItems.push({
        text: feat,
        source_url: c.video_url,
        commercial_intent: hasCommercial,
        is_feature_request: true,
      });
    }
  }

  for (const e of extractions) {
    if (e.notes) {
      allItems.push({
        text: e.notes,
        source_url: e.video_url,
        commercial_intent: false,
        is_feature_request: false,
      });
    }
  }

  if (allItems.length === 0) {
    console.error("No pain points found in input files.");
    process.exit(1);
  }

  console.log(
    `Clustering ${allItems.length} pain points into ${args.nClusters} clusters...`
  );

  const client = new Anthropic();
  const clusters = await clusterWithClaude(client, allItems, args.nClusters);

  clusters.sort(
    (a, b) =>
      b.frequency * b.commercial_intent_score -
      a.frequency * a.commercial_intent_score
  );

  const output: ClusterOutput = {
    generated_at: new Date().toISOString(),
    total_pain_points: allItems.length,
    n_clusters_requested: args.nClusters,
    clusters,
  };

  const dir = path.dirname(args.output);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(output, null, 2), "utf-8");

  console.log(`Clusters written to ${args.output}`);
  console.log(`Top cluster: "${clusters[0]?.cluster_name}" (freq=${clusters[0]?.frequency})`);
}

main().catch((err) => {
  console.error("cluster.ts failed:", err);
  process.exit(1);
});
