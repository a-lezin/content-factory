"""
scrape.py

Collects TikTok and Instagram Reels videos for a niche via Apify MCP, then downloads and
transcribes the top-N videos with yt-dlp + Whisper.

This script is called by Claude Code as part of the /discover-niche skill.
The actual Apify MCP calls are delegated to Claude Code's tool runner
(Claude invokes the Apify MCP tool and passes results here).
The download/transcribe steps use the bash tool within Claude Code.

Usage (called by Claude Code skill, not directly):
  python viral-factory/scripts/scrape.py \
    --slug watchover \
    --keywords "how to track my kid,screen time fight" \
    --accounts "@competitor1,@competitor2" \
    --min-views 50000 \
    --min-comments 1000 \
    --top-n 50 \
    --output artifacts/viral-factory/raw/watchover.json

Output: CollectionRecord[] JSON (see schemas/collection.json)
"""

import argparse
import json
import os
from datetime import datetime, timezone


# ─── Apify MCP Contract ───────────────────────────────────────────────────────
#
# Claude Code invokes Apify MCP directly. This block documents the expected
# input/output contract so Claude knows what to pass and what to expect back.
#
# Actor: clockworks/tiktok-scraper
#
# Input (Claude passes to Apify MCP):
#   {
#     "searchQueries": [...],   // keywords and hashtag seeds (without #)
#     "maxItems": 200,
#     "resultsType": "posts",
#     "proxyCountryCode": "US"  // or "UA" for geo-targeted pass
#   }
#
# Output (Apify returns to Claude, Claude maps to CollectionRecord):
#   Array of TikTok post objects with: id, webVideoUrl, authorMeta,
#   createTime, playCount, diggCount, commentCount, shareCount, collectCount,
#   text, hashtags, musicMeta, videoMeta
#
# Batch author median views: ONE call to clockworks/tiktok-profile-scraper
#   Input: { "profiles": [handle1, handle2, ...], "resultsPerPage": 20 }
#   Then compute median playCount per author from results.
#   (Do NOT call one-by-one — batch all ~40 candidate handles in a single run)
#
# Comments: clockworks/tiktok-comments-scraper
#   { "postUrls": [url], "commentsPerPost": 500 }
#
# Instagram Reels: search Apify Store for the best available actor
#   (mcp__claude_ai_apify__search-actors with query "instagram reels scraper")
#   Typical input: { "hashtags": [...], "maxResults": 100 }


def map_apify_response_to_collection(
    apify_item: dict,
    author_median_views: int,
    platform: str = "tiktok",
    geo: str = "global_en",
) -> dict:
    author_meta = apify_item.get("authorMeta") or {}
    video_meta = apify_item.get("videoMeta") or {}
    music_meta = apify_item.get("musicMeta") or {}
    hashtags = apify_item.get("hashtags") or []

    create_time = apify_item.get("createTime", 0)
    posted_at = datetime.fromtimestamp(int(create_time), tz=timezone.utc).isoformat()

    sound_id = str(music_meta.get("musicId", "")) or None
    video_file_url = str(video_meta.get("downloadAddr", "")) or None

    return {
        "video_id": str(apify_item.get("id") or apify_item.get("videoId") or ""),
        "platform": platform,
        "url": str(apify_item.get("webVideoUrl") or apify_item.get("url") or ""),
        "author": str(author_meta.get("name") or apify_item.get("author") or ""),
        "author_url": str(author_meta.get("profileUrl") or ""),
        "posted_at": posted_at,
        "duration_sec": int(video_meta.get("duration", 0)),
        "views": int(apify_item.get("playCount", 0)),
        "likes": int(apify_item.get("diggCount", 0)),
        "comments_count": int(apify_item.get("commentCount", 0)),
        "shares": int(apify_item.get("shareCount", 0)),
        "saves": int(apify_item.get("collectCount", 0)),
        "caption": str(apify_item.get("text") or ""),
        "hashtags": [h.get("name", "") for h in hashtags if isinstance(h, dict)],
        "sound_id": sound_id,
        "sound_is_trending": bool(music_meta.get("isTrending", False)),
        "video_file_url": video_file_url,
        "video_file_path": None,
        "author_median_views": author_median_views,
        "transcript": None,
        "comments": None,
        "geo": geo,
        "text_language": None,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def map_instagram_response_to_collection(
    instagram_item: dict,
    author_median_views: int = 1,
    geo: str = "global_en",
) -> dict:
    """Map an Instagram Reels API item to CollectionRecord schema.

    Field mapping varies by actor. This covers the most common field names
    returned by popular Apify Instagram Reels actors.
    """
    owner = instagram_item.get("ownerUsername") or instagram_item.get("owner", {}).get("username", "")
    posted_at_raw = (
        instagram_item.get("timestamp")
        or instagram_item.get("taken_at_timestamp")
        or instagram_item.get("takenAtTimestamp")
        or 0
    )
    if isinstance(posted_at_raw, int):
        posted_at = datetime.fromtimestamp(posted_at_raw, tz=timezone.utc).isoformat()
    else:
        posted_at = str(posted_at_raw)

    hashtags_raw = instagram_item.get("hashtags") or []
    if isinstance(hashtags_raw, list) and hashtags_raw and isinstance(hashtags_raw[0], dict):
        hashtags = [h.get("name", "") for h in hashtags_raw]
    else:
        hashtags = [str(h).lstrip("#") for h in hashtags_raw]

    return {
        "video_id": str(instagram_item.get("id") or instagram_item.get("shortCode") or ""),
        "platform": "reels",
        "url": str(instagram_item.get("url") or instagram_item.get("displayUrl") or ""),
        "author": str(owner),
        "author_url": f"https://www.instagram.com/{owner}/" if owner else "",
        "posted_at": posted_at,
        "duration_sec": float(instagram_item.get("videoDuration") or instagram_item.get("duration") or 0),
        "views": int(instagram_item.get("videoPlayCount") or instagram_item.get("playCount") or instagram_item.get("views") or 0),
        "likes": int(instagram_item.get("likesCount") or instagram_item.get("likes") or 0),
        "comments_count": int(instagram_item.get("commentsCount") or instagram_item.get("comments") or 0),
        "shares": 0,
        "saves": 0,
        "caption": str(instagram_item.get("caption") or instagram_item.get("text") or ""),
        "hashtags": hashtags,
        "sound_id": str(instagram_item.get("musicInfo", {}).get("id") or "") or None,
        "sound_is_trending": False,
        "video_file_url": str(instagram_item.get("videoUrl") or "") or None,
        "video_file_path": None,
        "author_median_views": author_median_views,
        "transcript": None,
        "comments": None,
        "geo": geo,
        "text_language": None,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def compute_author_medians(profile_results: list[dict]) -> dict[str, float]:
    """Compute per-author median playCount from a batch profile-scraper result.

    profile_results: flat list of video objects returned by clockworks/tiktok-profile-scraper
                     (all authors in one batch run)
    Returns: { author_handle → median_play_count }
    """
    from collections import defaultdict

    author_plays: dict[str, list[int]] = defaultdict(list)
    for item in profile_results:
        author_meta = item.get("authorMeta") or {}
        handle = str(author_meta.get("name") or item.get("author") or "")
        play_count = int(item.get("playCount", 0))
        if handle:
            author_plays[handle].append(play_count)

    medians: dict[str, float] = {}
    for handle, plays in author_plays.items():
        plays_sorted = sorted(plays)
        n = len(plays_sorted)
        if n == 0:
            medians[handle] = 1.0
        elif n % 2 == 1:
            medians[handle] = float(plays_sorted[n // 2])
        else:
            medians[handle] = (plays_sorted[n // 2 - 1] + plays_sorted[n // 2]) / 2.0
    return medians


# ─── yt-dlp + Whisper commands ────────────────────────────────────────────────

def yt_dlp_command(url: str, output_path: str) -> str:
    return f'yt-dlp -o "{output_path}" --no-playlist --quiet "{url}"'


def whisper_command(video_path: str, output_dir: str) -> str:
    return (
        f'whisper "{video_path}" --model base --output_format json '
        f'--output_dir "{output_dir}" --word_timestamps True'
    )


# ─── Filter helpers ───────────────────────────────────────────────────────────

def filter_by_views(records: list[dict], min_views: int) -> list[dict]:
    return [r for r in records if r.get("views", 0) >= min_views]


def top_by_views(records: list[dict], n: int) -> list[dict]:
    return sorted(records, key=lambda r: r.get("views", 0), reverse=True)[:n]


def dedup_by_video_id(records: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out = []
    for r in records:
        vid = r.get("video_id", "")
        if vid and vid not in seen:
            seen.add(vid)
            out.append(r)
    return out


def cap_per_author(records: list[dict], max_per_author: int) -> list[dict]:
    """Return records with at most max_per_author entries per author (preserving order)."""
    counts: dict[str, int] = {}
    out = []
    for r in records:
        author = r.get("author", "")
        if counts.get(author, 0) < max_per_author:
            counts[author] = counts.get(author, 0) + 1
            out.append(r)
    return out


# ─── Output helpers ───────────────────────────────────────────────────────────

def write_records(records: list[dict], output_path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(records)} records to {output_path}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Print Apify MCP + yt-dlp + Whisper orchestration plan for Claude Code."
    )
    parser.add_argument("--slug", default="unknown")
    parser.add_argument("--keywords", default="")
    parser.add_argument("--accounts", default="")
    parser.add_argument("--min-views", dest="min_views", type=int, default=50000)
    parser.add_argument("--min-comments", dest="min_comments", type=int, default=1000)
    parser.add_argument("--top-n", dest="top_n", type=int, default=50)
    parser.add_argument("--output", default="")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    slug = args.slug
    keywords = [k for k in args.keywords.split(",") if k]
    accounts = [a for a in args.accounts.split(",") if a]
    output = args.output or f"artifacts/viral-factory/raw/{slug}.json"

    print("=== scrape.py: Apify MCP + yt-dlp + Whisper pipeline ===")
    print()
    print("Step 0: LLM seed expansion (done by Claude before calling this script)")
    print("  Generates ~20–30 queries in 4 baskets: pain / format / topic / hashtag")
    print()
    print("Step 1a: Claude calls Apify MCP — TikTok global EN")
    print("  Actor: clockworks/tiktok-scraper")
    print("  Keywords:", keywords)
    print("  proxyCountryCode: US  →  geo: global_en")
    print()
    print("Step 1b: Claude calls Apify MCP — TikTok UA")
    print("  Actor: clockworks/tiktok-scraper")
    print("  proxyCountryCode: UA  →  geo: ua")
    print()
    print("Step 1c: Claude calls Apify MCP — Instagram Reels")
    print("  Actor: best available (search-actors 'instagram reels scraper')")
    print("  Hashtag seeds from expansion basket (d)")
    print()
    if accounts:
        print("Step 1d: Account scrape")
        print("  Actor: clockworks/tiktok-profile-scraper")
        print("  Accounts:", accounts)
        print()
    print("Step 1e: Merge all, dedup by video_id, filter by min_views:", args.min_views)
    print()
    print("Step 1f: Batch author-median — ONE call to clockworks/tiktok-profile-scraper")
    print("  profiles: [all ~40 candidate handles]")
    print("  resultsPerPage: 20")
    print("  Compute median playCount per author → enrich author_median_views")
    print()
    print("Step 1g: Comments")
    print("  Actor: clockworks/tiktok-comments-scraper")
    print(f"  For videos with comments_count >= {args.min_comments}")
    print()
    print(f"Step 1h: Download + transcribe top {args.top_n} videos:")
    print("  Command: yt-dlp -o /tmp/viral-factory/{video_id}.%(ext)s {url}")
    print("  Command: whisper {path} --model base --output_format json --word_timestamps True")
    print()
    print("Output:", output)
    print("Reference: scripts/schemas/collection.json")


if __name__ == "__main__":
    main()
