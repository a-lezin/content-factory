"""
cluster.py

Data-preparation step for pain point clustering.
Reads video-analyst extractions and comment-miner outputs, assembles PainItem[],
and writes them to {output}.items.json for the pain-clusterer agent.

The actual clustering is done by the pain-clusterer agent in /discover-niche Step 6.
This script has no LLM dependency — it is a pure data transform.

Usage:
  python viral-factory/scripts/cluster.py \
    --extractions artifacts/viral-factory/{project}/extractions/{slug}.json \
    --comments    artifacts/viral-factory/{project}/comments/{slug}.json \
    --output      artifacts/viral-factory/{project}/clusters/{slug}.json

Output:
  {output}.items.json  — PainItem[] ready for the pain-clusterer agent
  Prints a summary to stdout.
"""

import argparse
import json
import os
import sys


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare PainItem[] from extractions + comment-miner outputs."
    )
    parser.add_argument("--extractions", required=True, help="Path to extractions JSON")
    parser.add_argument("--comments", required=True, help="Path to comment-miner JSON")
    parser.add_argument("--output", required=True, help="Base path for cluster output")
    return parser.parse_args()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()

    extractions: list[dict] = []
    if os.path.exists(args.extractions):
        with open(args.extractions, encoding="utf-8") as f:
            extractions = json.load(f)

    comments: list[dict] = []
    if os.path.exists(args.comments):
        with open(args.comments, encoding="utf-8") as f:
            comments = json.load(f)

    items: list[dict] = []

    for c in comments:
        has_commercial = len(c.get("commercial_intent") or []) > 0
        for pain in c.get("pain_points") or []:
            items.append({
                "text": pain,
                "source_url": c["video_url"],
                "commercial_intent": has_commercial,
                "is_feature_request": False,
            })
        for feat in c.get("feature_requests") or []:
            items.append({
                "text": feat,
                "source_url": c["video_url"],
                "commercial_intent": has_commercial,
                "is_feature_request": True,
            })

    for e in extractions:
        if e.get("notes"):
            items.append({
                "text": e["notes"],
                "source_url": e["video_url"],
                "commercial_intent": False,
                "is_feature_request": False,
            })

    if not items:
        print("No pain points found in input files.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    items_path = args.output + ".items.json"
    with open(items_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print(f"Prepared {len(items)} pain items → {items_path}")
    print(f"Next: launch pain-clusterer agent with contents of {items_path} and n_clusters=8")
    print(f"Agent returns PainCluster[]. Wrap in ClusterOutput and write to {args.output}")


if __name__ == "__main__":
    main()
