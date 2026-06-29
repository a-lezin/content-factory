"""
score.py

Computes OutlierScore and NicheScore for each video in a raw collection.
All component scores are min-max normalized within the batch.

Usage:
  python viral-factory/scripts/score.py \
    --input artifacts/viral-factory/{project}/raw/{slug}.json \
    --output artifacts/viral-factory/{project}/scored/{slug}.json

NicheScore = 0.40×OutlierScore_norm + 0.30×SaveShareRate_norm
           + 0.15×Velocity_norm + 0.15×PainDensity
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone


# ─── Math helpers ─────────────────────────────────────────────────────────────

def days_since(iso_date: str) -> float:
    posted = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    days = (now - posted).total_seconds() / 86400
    return max(days, 0.5)


def min_max_normalize(values: list[float]) -> list[float]:
    mn, mx = min(values), max(values)
    if mx == mn:
        return [0.5] * len(values)
    return [(v - mn) / (mx - mn) for v in values]


# ─── Scoring ──────────────────────────────────────────────────────────────────

def score_records(
    records: list[dict],
    default_pain_density: float = 0.5,
) -> list[dict]:
    raw_outlier = [
        r["views"] / r["author_median_views"] if r.get("author_median_views", 0) > 0 else 1.0
        for r in records
    ]
    raw_save_share = [
        (r.get("saves", 0) + r.get("shares", 0)) / r["views"] if r.get("views", 0) > 0 else 0.0
        for r in records
    ]
    raw_velocity = [r["views"] / days_since(r["posted_at"]) for r in records]

    norm_outlier = min_max_normalize(raw_outlier)
    norm_save_share = min_max_normalize(raw_save_share)
    norm_velocity = min_max_normalize(raw_velocity)

    scored = []
    for i, record in enumerate(records):
        niche_score = (
            0.40 * norm_outlier[i]
            + 0.30 * norm_save_share[i]
            + 0.15 * norm_velocity[i]
            + 0.15 * default_pain_density
        )
        scored.append({
            **record,
            "outlier_score": raw_outlier[i],
            "outlier_score_norm": norm_outlier[i],
            "save_share_rate": raw_save_share[i],
            "save_share_rate_norm": norm_save_share[i],
            "velocity": raw_velocity[i],
            "velocity_norm": norm_velocity[i],
            "pain_density": default_pain_density,
            "niche_score": min(niche_score, 1.0),
        })
    return scored


def update_pain_density(scored_records: list[dict], pain_density_map: dict[str, float]) -> list[dict]:
    """Update pain_density after comment-miner results arrive and recompute NicheScore."""
    updated = []
    for record in scored_records:
        pd = pain_density_map.get(record["video_id"], record["pain_density"])
        niche_score = (
            0.40 * record["outlier_score_norm"]
            + 0.30 * record["save_share_rate_norm"]
            + 0.15 * record["velocity_norm"]
            + 0.15 * pd
        )
        updated.append({**record, "pain_density": pd, "niche_score": min(niche_score, 1.0)})
    return updated


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Score a raw video collection and produce NicheScore."
    )
    parser.add_argument("--input", required=True, help="Path to raw CollectionRecord[] JSON")
    parser.add_argument("--output", required=True, help="Path to write scored JSON")
    parser.add_argument(
        "--default-pain-density", dest="default_pain_density",
        type=float, default=0.5,
        help="Default pain_density value before comment-miner results (0–1)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    with open(args.input, encoding="utf-8") as f:
        records: list[dict] = json.load(f)

    print(f"Scoring {len(records)} videos...")
    scored = score_records(records, args.default_pain_density)
    sorted_scored = sorted(scored, key=lambda r: r["niche_score"], reverse=True)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(sorted_scored, f, indent=2, ensure_ascii=False)

    top = sorted_scored[0] if sorted_scored else None
    print(f"Done. {len(sorted_scored)} videos scored.")
    if top:
        print(f"Top NicheScore: {top['niche_score']:.3f} ({top['url']})")
        outlier_10x = sum(1 for r in sorted_scored if r["outlier_score"] >= 10)
        print(
            f"Top OutlierScore: {top['outlier_score']:.1f}x "
            f"(min_outlier check: {outlier_10x} videos pass ×10 threshold)"
        )
    print(f"Output: {args.output}")


if __name__ == "__main__":
    main()
