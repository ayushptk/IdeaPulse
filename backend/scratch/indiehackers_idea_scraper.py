"""
Scrape Indie Hackers posts and extract SaaS/business ideas.

Usage:
    python scratch/indiehackers_idea_scraper.py --limit 40
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx

try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover - optional dependency at runtime
    genai = None
    types = None


IH_BASE_URL = "https://www.indiehackers.com"
IH_FEEDS = [
    f"{IH_BASE_URL}/feed?sort=hot",
    f"{IH_BASE_URL}/",
]

STOPWORDS = {
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "have",
    "about",
    "your",
    "just",
    "into",
    "they",
    "their",
    "there",
    "would",
    "could",
    "what",
    "when",
    "where",
    "while",
    "still",
    "been",
    "them",
    "then",
    "than",
    "want",
    "gets",
}

SAAS_HINTS = (
    "saas",
    "tool",
    "software",
    "platform",
    "api",
    "automation",
    "workflow",
    "analytics",
    "dashboard",
    "subscription",
    "b2b",
    "mrr",
)

BUSINESS_HINTS = (
    "market",
    "customers",
    "customer",
    "pricing",
    "revenue",
    "sales",
    "growth",
    "founder",
    "monetization",
    "niche",
    "audience",
    "distribution",
)

NOISE_HINTS = ("hiring:", "jobad-", "apply now", "part time", "full time")


@dataclass
class ExtractedIdea:
    category: str
    title: str
    source_url: str
    reason: str
    problem: str
    opportunity: str
    confidence: float


def _extract_next_json(html: str) -> dict[str, Any] | None:
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">\s*(.*?)\s*</script>',
        html,
        flags=re.DOTALL,
    )
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None


def _walk_json_collect_posts(data: Any, posts: list[dict[str, Any]]) -> None:
    if isinstance(data, dict):
        looks_like_post = (
            "title" in data
            and ("slug" in data or "url" in data)
            and ("text" in data or "body" in data or "headline" in data)
        )
        if looks_like_post:
            posts.append(data)
        for value in data.values():
            _walk_json_collect_posts(value, posts)
    elif isinstance(data, list):
        for item in data:
            _walk_json_collect_posts(item, posts)


def _extract_post_links_from_html(page_html: str) -> list[dict[str, str]]:
    pattern = re.compile(r'<a[^>]+href="(/post/[^"]+)"[^>]*>(.*?)</a>', flags=re.DOTALL | re.IGNORECASE)
    matches = pattern.findall(page_html)
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    for href, title_html in matches:
        title_text = re.sub(r"<[^>]+>", " ", title_html)
        title_text = html.unescape(" ".join(title_text.split())).strip()
        if len(title_text) < 18:
            continue
        full_url = urljoin(IH_BASE_URL + "/", href)
        if full_url in seen:
            continue
        seen.add(full_url)
        links.append({"title": title_text, "url": full_url})
    return links


def _extract_meta_content(page_html: str, key: str) -> str:
    patterns = [
        rf'<meta[^>]+property="{re.escape(key)}"[^>]+content="([^"]+)"',
        rf'<meta[^>]+content="([^"]+)"[^>]+property="{re.escape(key)}"',
        rf'<meta[^>]+name="{re.escape(key)}"[^>]+content="([^"]+)"',
        rf'<meta[^>]+content="([^"]+)"[^>]+name="{re.escape(key)}"',
    ]
    for pattern in patterns:
        match = re.search(pattern, page_html, flags=re.IGNORECASE)
        if match:
            return html.unescape(match.group(1)).strip()
    return ""


def _fetch_post_detail(client: httpx.Client, title: str, url: str) -> dict[str, str]:
    try:
        response = client.get(url)
        response.raise_for_status()
    except httpx.HTTPError:
        return {"title": title, "body": "", "url": url, "content": title}

    page_html = response.text
    page_title = _extract_meta_content(page_html, "og:title") or title
    description = _extract_meta_content(page_html, "og:description") or _extract_meta_content(
        page_html, "description"
    )
    if not description:
        description = _extract_meta_content(page_html, "twitter:description")

    content = f"{page_title}\n{description}".strip()
    return {"title": page_title, "body": description, "url": url, "content": content}


def _normalize_post(raw: dict[str, Any]) -> dict[str, str]:
    title = str(raw.get("title") or raw.get("headline") or "").strip()
    body = str(raw.get("body") or raw.get("text") or raw.get("content") or "").strip()
    slug = str(raw.get("slug") or "").strip()
    url = str(raw.get("url") or "").strip()

    if not url and slug:
        url = urljoin(IH_BASE_URL + "/", slug)
    elif url and url.startswith("/"):
        url = urljoin(IH_BASE_URL + "/", url)

    content = f"{title}\n{body}".strip()
    return {"title": title, "body": body, "url": url, "content": content}


def _top_keywords(text: str, max_words: int = 4) -> str:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9]{2,}", text.lower())
    freq: dict[str, int] = {}
    for w in words:
        if w in STOPWORDS:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return ", ".join(w for w, _ in ranked[:max_words]) or "general founder pain"


def _build_problem_statement(text: str) -> str:
    sentence_split = re.split(r"(?<=[.!?])\s+", text)
    for s in sentence_split:
        lowered = s.lower()
        if any(trigger in lowered for trigger in ("problem", "pain", "frustrat", "hard", "stuck")):
            return s.strip()[:240]
    return sentence_split[0].strip()[:240] if sentence_split and sentence_split[0].strip() else text[:240]


def _classify_and_extract(post: dict[str, str]) -> ExtractedIdea | None:
    text = post["content"]
    if len(text) < 40:
        return None

    lowered = text.lower()
    if any(hint in lowered for hint in NOISE_HINTS):
        return None

    saas_score = sum(1 for h in SAAS_HINTS if h in lowered)
    business_score = sum(1 for h in BUSINESS_HINTS if h in lowered)

    if max(saas_score, business_score) < 2:
        return None

    category = "saas_idea" if saas_score >= business_score else "business_idea"
    confidence = min(0.98, 0.45 + 0.08 * max(saas_score, business_score))
    keywords = _top_keywords(text)
    problem = _build_problem_statement(text)
    opportunity = (
        f"Build for keywords: {keywords}. Start with MVP for a narrow niche and validate pricing early."
    )
    reason = (
        f"Signals: saas_score={saas_score}, business_score={business_score}, "
        f"mentions={keywords}"
    )

    return ExtractedIdea(
        category=category,
        title=post["title"] or "Untitled Indie Hackers discussion",
        source_url=post["url"] or IH_BASE_URL,
        reason=reason,
        problem=problem,
        opportunity=opportunity,
        confidence=round(confidence, 2),
    )


def scrape_indiehackers_posts(limit: int = 50) -> list[dict[str, str]]:
    raw_posts: list[dict[str, Any]] = []
    normalized: list[dict[str, str]] = []
    seen_keys: set[tuple[str, str]] = set()

    with httpx.Client(timeout=30.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
        for url in IH_FEEDS:
            response = client.get(url)
            response.raise_for_status()
            payload = _extract_next_json(response.text)
            if payload:
                _walk_json_collect_posts(payload, raw_posts)
            else:
                raw_posts.extend(_extract_post_links_from_html(response.text))

        for raw in raw_posts:
            post = _normalize_post(raw) if "slug" in raw or "body" in raw or "text" in raw else raw
            key = (post["title"], post["url"])
            if key in seen_keys or not post["title"]:
                continue
            seen_keys.add(key)
            normalized.append(_fetch_post_detail(client, post["title"], post["url"]))
            if len(normalized) >= limit:
                break
    return normalized


def extract_ideas(posts: list[dict[str, str]]) -> list[ExtractedIdea]:
    ideas: list[ExtractedIdea] = []
    for post in posts:
        idea = _classify_and_extract(post)
        if idea:
            ideas.append(idea)
    return sorted(ideas, key=lambda x: x.confidence, reverse=True)


def extract_ideas_with_llm(posts: list[dict[str, str]], model: str, max_posts: int = 12) -> list[ExtractedIdea]:
    """
    Optional LLM extraction (Gemini). Intended for free-tier usage.
    Requires GEMINI_API_KEY in environment.
    """
    if not posts:
        return []
    if not genai or not types:
        return []

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return []

    samples = posts[:max_posts]
    post_blob = "\n\n".join(
        [
            f"POST {idx + 1}\nTITLE: {p['title']}\nURL: {p['url']}\nTEXT: {p['content'][:1200]}"
            for idx, p in enumerate(samples)
        ]
    )
    prompt = f"""You are a startup analyst.
Extract SaaS ideas and business ideas from the posts below.

Return ONLY valid JSON array. Each object must have exactly:
{{
  "category": "saas_idea or business_idea",
  "title": "short idea title",
  "source_url": "post url",
  "reason": "why this is a valid opportunity signal",
  "problem": "pain point",
  "opportunity": "proposed product/service opportunity",
  "confidence": 0.0
}}

Rules:
- Skip hiring/job postings.
- Prefer recurring pain points and unmet needs.
- confidence must be between 0.5 and 0.98.
- Return up to 10 ideas.

POSTS:
{post_blob}
"""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                max_output_tokens=3072,
            ),
        )
        raw = (response.text or "").strip()
        if raw.startswith("```"):
            raw = "\n".join(line for line in raw.splitlines() if not line.strip().startswith("```")).strip()
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            return []

        ideas: list[ExtractedIdea] = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            try:
                category = str(item.get("category", "saas_idea")).strip().lower()
                if category not in {"saas_idea", "business_idea"}:
                    category = "saas_idea"
                ideas.append(
                    ExtractedIdea(
                        category=category,
                        title=str(item.get("title", "Untitled idea")).strip()[:180],
                        source_url=str(item.get("source_url", IH_BASE_URL)).strip() or IH_BASE_URL,
                        reason=str(item.get("reason", "LLM identified strong market signal")).strip()[:300],
                        problem=str(item.get("problem", "")).strip()[:350],
                        opportunity=str(item.get("opportunity", "")).strip()[:350],
                        confidence=round(float(item.get("confidence", 0.6)), 2),
                    )
                )
            except Exception:
                continue
        return sorted(ideas, key=lambda x: x.confidence, reverse=True)
    except Exception:
        return []


def save_outputs(ideas: list[ExtractedIdea], out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    json_path = out_dir / f"indiehackers_ideas_{timestamp}.json"
    txt_path = out_dir / f"indiehackers_ideas_{timestamp}.txt"

    payload = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_ideas": len(ideas),
        "ideas": [asdict(i) for i in ideas],
    }
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [f"Total ideas extracted: {len(ideas)}", ""]
    for idx, idea in enumerate(ideas, start=1):
        lines.extend(
            [
                f"{idx}. [{idea.category}] {idea.title}",
                f"   URL: {idea.source_url}",
                f"   Confidence: {idea.confidence}",
                f"   Problem: {idea.problem}",
                f"   Opportunity: {idea.opportunity}",
                f"   Why selected: {idea.reason}",
                "",
            ]
        )
    txt_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, txt_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape Indie Hackers and extract SaaS/business ideas.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum posts to parse.")
    parser.add_argument(
        "--out-dir",
        type=str,
        default="scratch/output",
        help="Directory for extracted idea files.",
    )
    parser.add_argument(
        "--use-llm",
        action="store_true",
        help="Use Gemini extraction if GEMINI_API_KEY is set (free-tier eligible).",
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default="gemini-2.0-flash",
        help="Gemini model name for LLM extraction.",
    )
    args = parser.parse_args()

    posts = scrape_indiehackers_posts(limit=args.limit)
    ideas = extract_ideas_with_llm(posts, model=args.llm_model) if args.use_llm else []
    if not ideas:
        ideas = extract_ideas(posts)
    json_path, txt_path = save_outputs(ideas, Path(args.out_dir))

    print(f"Scraped posts: {len(posts)}")
    print(f"Ideas extracted: {len(ideas)}")
    print(f"JSON output: {json_path}")
    print(f"Text output: {txt_path}")


if __name__ == "__main__":
    main()
