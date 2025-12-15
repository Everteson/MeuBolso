from __future__ import annotations

import base64
import mimetypes
from pathlib import Path

from openai import OpenAI
from docling.document_converter import DocumentConverter

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
    content_list = [{"type": "text", "text": prompt}]

    # 1. Native PDF support
    if mime == "application/pdf":
        # OpenRouter plugin to control PDF engine when desired
        plugins = [
            {
                "id": "file-parser",
                "pdf": {"engine": settings.openrouter_pdf_engine},
            }
        ]
        content_list.append({
            "type": "file",
            "file": {"filename": filename, "file_data": data_url},
        })

    # 2. Native Image support
    elif mime in ["image/png", "image/jpeg", "image/webp", "image/gif"]:
        content_list.append({
             "type": "image_url",
             "image_url": {"url": data_url},
        })

    # 3. Fallback: Docling for everything else
    else:
        # Convert file to markdown using Docling
        try:
            converter = DocumentConverter()
            result = converter.convert(file_path)
            markdown = result.document.export_to_markdown()
            
            # Add to prompt text
            content_list[0]["text"] += f"\n\n--- Document Content ({filename}) ---\n{markdown}"
        except Exception as e:
            raise RuntimeError(f"Failed to process file with Docling: {e}")

    messages: list[dict] = [
        {
            "role": "user",
            "content": content_list,
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
