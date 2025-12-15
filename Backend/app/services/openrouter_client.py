from __future__ import annotations

import base64
import mimetypes
from pathlib import Path

from openai import OpenAI

from app.core.config import settings


def _file_to_data_url(path: str) -> tuple[str, str]:
    p = Path(path)
    mime, _ = mimetypes.guess_type(str(p))
    mime = mime or "application/octet-stream"
    raw = p.read_bytes()
    b64 = base64.b64encode(raw).decode("utf-8")
    return mime, f"data:{mime};base64,{b64}"


def _client() -> OpenAI:
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.openrouter_api_key,
        default_headers={
            # optional, helps OpenRouter analytics
            "HTTP-Referer": "https://meubolso.local",
            "X-Title": "MeuBolso",
        },
    )


def chat_completions_with_file(*, model: str, prompt: str, file_path: str, filename: str, tools: list[dict] | None = None) -> dict:
    """Call OpenRouter Chat Completions (OpenAI-compatible) sending a local file as a base64 data URL."""

    mime, data_url = _file_to_data_url(file_path)

    plugins = None
    if mime == "application/pdf":
        # OpenRouter plugin to control PDF engine when desired
        plugins = [
            {
                "id": "file-parser",
                "pdf": {"engine": settings.openrouter_pdf_engine},
            }
        ]

    messages: list[dict] = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "file",
                    "file": {"filename": filename, "file_data": data_url},
                },
            ],
        }
    ]

    kwargs: dict = {
        "model": model,
        "messages": messages,
    }

    # OpenRouter supports `plugins` as an extra top-level parameter.
    if plugins:
        kwargs["plugins"] = plugins

    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    client = _client()

    # OpenAI SDK returns a Pydantic-ish object, but `.model_dump()` gives us a plain dict.
    resp = client.chat.completions.create(**kwargs)
    return resp.model_dump()
