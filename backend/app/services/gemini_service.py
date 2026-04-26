import google.generativeai as genai
import json
import os
import re
import requests
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from AI response, handling markdown code blocks."""
    text = text.strip()
    # Remove markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text)
    text = text.strip()
    return json.loads(text)


def _fallback_result(reason: str) -> Dict[str, Any]:
    return {
        "similarity_score": 0.0,
        "classification": "FAN_CONTENT",
        "risk_level": "LOW",
        "confidence": 0.0,
        "short_reason": reason,
        "detailed_evidence": ["Could not complete AI analysis"],
        "suggested_action": "Retry analysis or review manually",
    }


COMPARISON_PROMPT_TEMPLATE = """You are a sports content copyright compliance AI.

Compare these two media assets for potential copyright infringement:

OFFICIAL ASSET:
- Title: "{official_title}"
- Description: "{official_desc}"
- Owner/Rights Holder: "{official_owner}"
- Event: "{official_event}"

SUSPECT ASSET:
- Title: "{suspect_title}"
- Platform: "{suspect_platform}"
- Uploader: "{suspect_uploader}"
- Source URL: "{suspect_url}"
- View Count: {suspect_views}

Analyze and output STRICT JSON only (no markdown, no extra text):
{{
  "similarity_score": <float 0.0 to 1.0>,
  "classification": "<AUTHORIZED|FAN_CONTENT|PIRACY_LIKELY>",
  "risk_level": "<LOW|MEDIUM|HIGH>",
  "confidence": <float 0.0 to 1.0>,
  "short_reason": "<brief one-sentence explanation>",
  "detailed_evidence": ["<evidence point 1>", "<evidence point 2>", "<evidence point 3>"],
  "suggested_action": "<specific recommended action>"
}}

Classification guidelines:
- AUTHORIZED: Official broadcast, licensed repost, or authorized distribution
- FAN_CONTENT: Fan-made highlights, commentary, clearly transformative use
- PIRACY_LIKELY: Unauthorized full match/event, direct rip of premium content, clear infringement

Risk level:
- LOW: Authorized or clearly fair use
- MEDIUM: Ambiguous, partial use, possible infringement
- HIGH: Clear piracy, unauthorized full match content, high view count indicating wide distribution

Output ONLY the JSON object."""


def compare_media_nvidia(
    official_title: str,
    official_desc: str,
    official_owner: str,
    official_event: str,
    suspect_title: str,
    suspect_platform: str,
    suspect_uploader: str,
    suspect_url: str,
    suspect_views: int,
    suspect_thumbnail_url: str = None,
) -> Dict[str, Any]:
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    prompt = COMPARISON_PROMPT_TEMPLATE.format(
        official_title=official_title,
        official_desc=official_desc or "N/A",
        official_owner=official_owner or "Unknown",
        official_event=official_event or "N/A",
        suspect_title=suspect_title,
        suspect_platform=suspect_platform,
        suspect_uploader=suspect_uploader,
        suspect_url=suspect_url or "N/A",
        suspect_views=suspect_views or 0,
    )
    payload = {
        "model": "meta/llama-3.1-405b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 1024,
        "top_p": 0.7,
    }
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    result = response.json()
    response_text = result["choices"][0]["message"]["content"]
    return _extract_json(response_text)


def compare_media_gemini(
    official_title: str,
    official_desc: str,
    official_owner: str,
    official_event: str,
    suspect_title: str,
    suspect_platform: str,
    suspect_uploader: str,
    suspect_url: str,
    suspect_views: int,
    suspect_thumbnail_url: str = None,
) -> Dict[str, Any]:
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = COMPARISON_PROMPT_TEMPLATE.format(
        official_title=official_title,
        official_desc=official_desc or "N/A",
        official_owner=official_owner or "Unknown",
        official_event=official_event or "N/A",
        suspect_title=suspect_title,
        suspect_platform=suspect_platform,
        suspect_uploader=suspect_uploader,
        suspect_url=suspect_url or "N/A",
        suspect_views=suspect_views or 0,
    )
    
    contents = [prompt]
    
    if suspect_thumbnail_url:
        try:
            resp = requests.get(suspect_thumbnail_url, timeout=5)
            if resp.status_code == 200:
                contents.append({
                    "mime_type": "image/jpeg",
                    "data": resp.content
                })
        except Exception as e:
            print(f"[Gemini] Failed to fetch thumbnail: {e}")
            
    response = model.generate_content(contents)
    return _extract_json(response.text)


def compare_media(official, suspect) -> Dict[str, Any]:
    """Main entry point: tries NVIDIA first, falls back to Gemini."""
    kwargs = dict(
        official_title=official.title,
        official_desc=official.description,
        official_owner=official.owner,
        official_event=official.event_name,
        suspect_title=suspect.title,
        suspect_platform=suspect.source_platform,
        suspect_uploader=suspect.uploader,
        suspect_url=suspect.source_url,
        suspect_views=suspect.view_count,
        suspect_thumbnail_url=suspect.thumbnail_url,
    )

    last_error = None

    if NVIDIA_API_KEY:
        try:
            return compare_media_nvidia(**kwargs)
        except Exception as e:
            last_error = f"NVIDIA error: {str(e)}"
            print(f"[NVIDIA] Analysis failed, falling back to Gemini: {e}")

    if GEMINI_API_KEY:
        try:
            return compare_media_gemini(**kwargs)
        except Exception as e:
            last_error = f"Gemini error: {str(e)}"
            print(f"[Gemini] Analysis failed: {e}")
            return _fallback_result(last_error)

    if last_error:
        # Had a key but it failed
        return _fallback_result(f"AI API call failed — {last_error}. Check your API key and network connection.")

    return _fallback_result("No AI API key configured. Add GEMINI_API_KEY to backend/.env (free at aistudio.google.com)")


# ── Takedown draft ────────────────────────────────────────────────────────────

TAKEDOWN_PROMPT_TEMPLATE = """Generate a professional DMCA takedown request email.

Details:
- Rights Holder / Sender: {official_owner}
- Official Content Title: {official_title}
- Platform to Notify: {suspect_platform}
- Infringing Content URL: {suspect_url}
- Infringing Uploader: {suspect_uploader}
- AI Classification: {classification}
- Risk Level: {risk_level}
- Similarity Score: {similarity_score:.0%}
- Evidence Points:
{evidence_lines}

Write a formal DMCA takedown request email that:
1. Clearly identifies the rights holder and their copyrighted work
2. Precisely identifies the infringing content and URL
3. States the legal basis (DMCA Section 512) for removal
4. Includes a good faith statement
5. Has a signature block with placeholder contact details
6. Is professional, concise, and ready to send after filling in contact info

Output ONLY the email body, no extra commentary."""


def generate_takedown_draft_nvidia(
    official_title, official_owner, suspect_url, suspect_platform,
    suspect_uploader, classification, risk_level, similarity_score, evidence
) -> str:
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
    prompt = TAKEDOWN_PROMPT_TEMPLATE.format(
        official_owner=official_owner or "Rights Holder",
        official_title=official_title,
        suspect_platform=suspect_platform,
        suspect_url=suspect_url or "Unknown URL",
        suspect_uploader=suspect_uploader or "Unknown",
        classification=classification,
        risk_level=risk_level,
        similarity_score=similarity_score,
        evidence_lines="\n".join(f"  - {e}" for e in evidence),
    )
    payload = {
        "model": "meta/llama-3.1-405b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 2048,
    }
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def generate_takedown_draft_gemini(
    official_title, official_owner, suspect_url, suspect_platform,
    suspect_uploader, classification, risk_level, similarity_score, evidence
) -> str:
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = TAKEDOWN_PROMPT_TEMPLATE.format(
        official_owner=official_owner or "Rights Holder",
        official_title=official_title,
        suspect_platform=suspect_platform,
        suspect_url=suspect_url or "Unknown URL",
        suspect_uploader=suspect_uploader or "Unknown",
        classification=classification,
        risk_level=risk_level,
        similarity_score=similarity_score,
        evidence_lines="\n".join(f"  - {e}" for e in evidence),
    )
    response = model.generate_content(prompt)
    return response.text.strip()


def generate_takedown_draft(
    official_title, official_owner, suspect_url, suspect_platform,
    suspect_uploader, classification, risk_level, similarity_score, evidence
) -> str:
    kwargs = dict(
        official_title=official_title,
        official_owner=official_owner,
        suspect_url=suspect_url,
        suspect_platform=suspect_platform,
        suspect_uploader=suspect_uploader,
        classification=classification,
        risk_level=risk_level,
        similarity_score=similarity_score,
        evidence=evidence,
    )
    if NVIDIA_API_KEY:
        try:
            return generate_takedown_draft_nvidia(**kwargs)
        except Exception as e:
            print(f"[NVIDIA] Takedown draft failed, falling back to Gemini: {e}")

    if GEMINI_API_KEY:
        try:
            return generate_takedown_draft_gemini(**kwargs)
        except Exception as e:
            print(f"[Gemini] Takedown draft failed: {e}")

    return "Error: No AI API configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in .env"
