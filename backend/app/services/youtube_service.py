import requests
import os
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


def _extract_keywords(title: str, event_name: str = None) -> str:
    """
    Build a YouTube search query from the asset title and event name.
    Strips common words, focuses on the most identifiable terms.
    """
    # Combine title and event
    text = f"{title} {event_name or ''}".strip()

    # Remove possessives, common words that pollute search
    stop_words = {
        "official", "the", "a", "an", "of", "and", "or", "in", "on",
        "at", "to", "for", "by", "from", "with", "is", "are", "was",
        "were", "be", "been", "being", "have", "has", "had", "do",
        "does", "did", "will", "would", "could", "should", "may",
        "might", "shall", "broadcast", "highlights", "clip", "video",
        "stream", "match", "game",
    }

    words = re.findall(r"[A-Za-z0-9]+", text)
    keywords = [w for w in words if w.lower() not in stop_words and len(w) > 2]

    # Limit to 5 best keywords
    query = " ".join(keywords[:5])
    return query or title


def _get_view_counts(video_ids: List[str]) -> Dict[str, int]:
    """Fetch real view counts for a list of video IDs."""
    if not video_ids or not YOUTUBE_API_KEY:
        return {}
    try:
        resp = requests.get(
            YOUTUBE_VIDEOS_URL,
            params={
                "part": "statistics",
                "id": ",".join(video_ids),
                "key": YOUTUBE_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            item["id"]: int(item["statistics"].get("viewCount", 0))
            for item in data.get("items", [])
        }
    except Exception as e:
        print(f"[YouTube] Failed to fetch view counts: {e}")
        return {}


def search_youtube_suspects(
    title: str,
    event_name: str = None,
    max_results: int = 5,
) -> List[Dict[str, Any]]:
    """
    Search YouTube for potential unauthorized clips matching the asset.
    Returns a list of dicts ready to insert as SuspectAsset records.
    """
    if not YOUTUBE_API_KEY:
        raise ValueError(
            "YOUTUBE_API_KEY not set in .env. "
            "Get a free key at https://console.cloud.google.com/"
        )

    query = _extract_keywords(title, event_name)
    print(f"[YouTube] Searching for: '{query}'")

    # Step 1 — search videos
    try:
        resp = requests.get(
            YOUTUBE_SEARCH_URL,
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "relevanceLanguage": "en",
                "key": YOUTUBE_API_KEY,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.HTTPError as e:
        if resp.status_code == 403:
            raise ValueError(
                "YouTube API key invalid or quota exceeded. "
                "Check your key at https://console.cloud.google.com/"
            )
        raise

    items = data.get("items", [])
    if not items:
        return []

    # Step 2 — get real view counts for all found videos
    video_ids = [item["id"]["videoId"] for item in items]
    view_counts = _get_view_counts(video_ids)

    # Step 3 — build suspect records
    suspects = []
    for item in items:
        vid_id = item["id"]["videoId"]
        snippet = item["snippet"]

        # Get best available thumbnail
        thumbs = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbs.get("high", {}).get("url")
            or thumbs.get("medium", {}).get("url")
            or thumbs.get("default", {}).get("url")
            or f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg"
        )

        suspects.append({
            "source_platform": "YouTube",
            "source_url": f"https://www.youtube.com/watch?v={vid_id}",
            "media_url": f"https://www.youtube.com/watch?v={vid_id}",
            "thumbnail_url": thumbnail_url,
            "title": snippet.get("title", "Unknown Title"),
            "uploader": snippet.get("channelTitle", "Unknown Channel"),
            "view_count": view_counts.get(vid_id, 0),
        })

    print(f"[YouTube] Found {len(suspects)} real suspect clips")
    return suspects
