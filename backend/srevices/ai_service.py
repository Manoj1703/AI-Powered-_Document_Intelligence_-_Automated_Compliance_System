from __future__ import annotations

import json
import os
import socket
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv
import httpx
from openai import OpenAI

# Load .env values from the backend root so startup works from any working directory.
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env")

# Support either custom variable names or standard OpenAI names.
api_key = os.getenv("API_TOKEN") or os.getenv("OPENAI_API_KEY")
api_base_url = os.getenv("API_BASE_URL") or os.getenv("OPENAI_BASE_URL")
openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
if api_base_url and "openrouter.ai" in api_base_url and "/" not in openai_model:
    openai_model = f"openai/{openai_model}"


def _env_bool(name: str, default: bool) -> bool:
    raw = str(os.getenv(name, str(default))).strip().lower()
    return raw in {"1", "true", "yes", "on"}


def _provider_name() -> str:
    base = str(api_base_url or "").lower()
    if "openrouter.ai" in base:
        return "OpenRouter"
    return "OpenAI"


def _resolved_base_url() -> str:
    return str(api_base_url or "https://api.openai.com/v1").strip()


def _base_hostname() -> str:
    parsed = urlparse(_resolved_base_url())
    return str(parsed.hostname or "").strip()


def ai_provider_name() -> str:
    return _provider_name()


def format_connection_error_detail(exc: Exception) -> str:
    provider = _provider_name()
    base_url = _resolved_base_url()
    host = _base_hostname()
    base_msg = str(exc).strip() or "Connection error."
    diagnostics: list[str] = [f"Provider={provider}", f"Base URL={base_url}"]
    if host:
        try:
            socket.getaddrinfo(host, 443)
        except socket.gaierror:
            diagnostics.append(f"DNS lookup failed for {host}")
    diagnostics.append("Check internet/firewall/proxy access to the provider host")
    return f"{base_msg} ({'; '.join(diagnostics)})"


# Create OpenAI client only if key is available.
client = (
    OpenAI(
        api_key=api_key,
        base_url=api_base_url,
        # Default to trusting env proxies; disable by setting OPENAI_TRUST_ENV=false.
        http_client=httpx.Client(
            trust_env=_env_bool("OPENAI_TRUST_ENV", True),
            timeout=httpx.Timeout(connect=10.0, read=45.0, write=45.0, pool=45.0),
        ),
    )
    if api_key
    else None
)


# Normalize list-like values from model output into clean string lists.
def _to_list_of_str(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


# Safe fallback payload when model output is not valid JSON.
def _fallback_result(raw_text: str) -> dict[str, Any]:
    return {
        "title": "Unknown",
        "document_type": "Unknown",
        "author": "Unknown",
        "date": "",
        "summary": "Analysis returned an unexpected format.",
        "detailed_summary": "Analysis returned an unexpected format.",
        "metadata": {
            "document_type": "Unknown",
            "key_topics": [],
        },
        "key_clauses": [],
        "obligations": [],
        "risks": [
            {
                "risk_type": "ParsingError",
                "description": "AI response could not be parsed as JSON.",
                "severity": "Medium",
            }
        ],
        "risk_types": ["ParsingError"],
        "compliance_issues": [],
        "overall_risk_level": "Medium",
        "raw_model_output": raw_text,
    }


# Enforce consistent schema/types even when model output varies.
def _normalize_result(parsed: dict[str, Any]) -> dict[str, Any]:
    detailed_summary = str(parsed.get("detailed_summary") or parsed.get("summary") or "").strip()
    summary = str(parsed.get("summary") or detailed_summary).strip()

    metadata = parsed.get("metadata")
    if not isinstance(metadata, dict):
        metadata = {}

    document_type = str(
        parsed.get("document_type")
        or metadata.get("document_type")
        or "Unknown"
    ).strip()

    key_topics = _to_list_of_str(metadata.get("key_topics"))

    risks = parsed.get("risks")
    if not isinstance(risks, list):
        risks = []

    normalized_risks: list[dict[str, Any]] = []
    for risk in risks:
        if not isinstance(risk, dict):
            continue
        normalized_risks.append(
            {
                "risk_type": str(risk.get("risk_type") or "GeneralRisk").strip(),
                "description": str(risk.get("description") or "").strip(),
                "severity": str(risk.get("severity") or "Medium").strip(),
            }
        )

    risk_types = _to_list_of_str(parsed.get("risk_types"))
    if not risk_types:
        risk_types = [r["risk_type"] for r in normalized_risks if r.get("risk_type")]

    normalized = {
        "title": str(parsed.get("title") or "Unknown").strip(),
        "document_type": document_type,
        "author": str(parsed.get("author") or "Unknown").strip(),
        "date": str(parsed.get("date") or "").strip(),
        "summary": summary,
        "detailed_summary": detailed_summary,
        "metadata": {
            "document_type": document_type,
            "key_topics": key_topics,
        },
        "key_clauses": _to_list_of_str(parsed.get("key_clauses")),
        "obligations": _to_list_of_str(parsed.get("obligations")),
        "risks": normalized_risks,
        "risk_types": risk_types,
        "compliance_issues": _to_list_of_str(parsed.get("compliance_issues")),
        "overall_risk_level": str(parsed.get("overall_risk_level") or "Medium").strip(),
    }
    return normalized


# Main service method: sends extracted text to LLM and returns normalized JSON.
def analyze_document(text: str) -> dict[str, Any]:
    if not client:
        raise ValueError(
            "Set API_TOKEN (or OPENAI_API_KEY) in environment variables."
        )
    source_text = str(text or "")
    # Keep prompt size bounded to reduce model context errors on very large files.
    prompt_text = source_text[:12000]
    if len(source_text) > len(prompt_text):
        prompt_text += "\n\n[Document content truncated for analysis]"

    # Prompt forces strict JSON schema so downstream parsing is reliable.
    prompt = f"""
You are a legal document analysis system.
Return valid JSON only.

Extract structured metadata in JSON format:
{{
  "title": "",
  "document_type": "",
  "author": "",
  "date": "",
  "detailed_summary": "",
  "summary": "",
  "key_clauses": [],
  "obligations": [],
  "risks": [
    {{
      "risk_type": "",
      "description": "",
      "severity": "Low | Medium | High"
    }}
  ],
  "risk_types": [],
  "compliance_issues": [],
  "metadata": {{
    "document_type": "",
    "key_topics": []
  }},
  "overall_risk_level": "Low | Medium | High"
}}

Rules:
- Keep title/author/date empty string if unknown.
- detailed_summary should be 8-12 sentences.
- summary should be 2-4 sentences.
- risk_types should be a concise list of risk categories.

Document content:
{prompt_text}
""".strip()

    response = client.chat.completions.create(
        model=openai_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional legal and compliance analyst. "
                    "Produce structured analysis with specific clauses, obligations, "
                    "risk categories, and compliance concerns."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    content = (response.choices[0].message.content or "").strip()

    # If model outputs malformed JSON, return deterministic fallback payload.
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return _fallback_result(content)

    return _normalize_result(parsed)
