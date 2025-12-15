from __future__ import annotations

import json
from datetime import date

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transaction import Transaction
from app.services.openrouter_client import chat_completions_with_file


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_transactions",
            "description": "Create normalized transactions parsed from the provided document/extract.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transactions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "description": {"type": "string"},
                                "amount": {"type": "number"},
                                "type": {"type": "string", "enum": ["INCOME", "EXPENSE"]},
                                "category": {"type": "string"},
                                "tag": {"type": ["string", "null"]},
                                "date": {"type": "string", "description": "YYYY-MM-DD"},
                                "isRecurring": {"type": "boolean"},
                            },
                            "required": ["description", "amount", "type", "category", "date", "isRecurring"],
                        },
                    }
                },
                "required": ["transactions"],
            },
        },
    }
]


SYSTEM_PROMPT = (
    "Você é um assistente financeiro. Extraia transações (entradas/saídas) a partir do arquivo anexado "
    "(pode ser CSV/XLSX/PDF/Imagem). Retorne usando a tool create_transactions com uma lista de transações. "
    "Regras: valores sempre positivos; tipo EXPENSE para gastos; category e tag curtas; date em YYYY-MM-DD; "
    "se não tiver data use a data de hoje. Não invente dados que não estão no documento; se estiver ambíguo, "
    "use descrição clara e marque categoria como 'Outros'."
)


async def process_import_file_to_transactions(*, db: Session, user_id: int, file_path: str, filename: str) -> int:
    prompt = SYSTEM_PROMPT

    resp = chat_completions_with_file(
        model=settings.openrouter_model,
        prompt=prompt,
        file_path=file_path,
        filename=filename,
        tools=TOOLS,
    )

    # Parse tool calls
    choices = resp.get("choices") or []
    if not choices:
        raise RuntimeError("No choices returned from model")

    msg = choices[0].get("message") or {}
    tool_calls = msg.get("tool_calls") or []
    if not tool_calls:
        # fallback: try to parse JSON in content
        content = msg.get("content")
        raise RuntimeError(f"Model did not call tool. content={content}")

    created = 0

    for call in tool_calls:
        fn = (call.get("function") or {})
        if fn.get("name") != "create_transactions":
            continue

        raw_args = fn.get("arguments")
        if isinstance(raw_args, str):
            args = json.loads(raw_args)
        else:
            args = raw_args

        txs = args.get("transactions") or []
        for t in txs:
            tx_date = t.get("date")
            if not tx_date:
                tx_date = date.today().isoformat()

            tx = Transaction(
                user_id=user_id,
                description=t.get("description") or "(import)",
                amount=float(t.get("amount") or 0),
                type=t.get("type") or "EXPENSE",
                category=t.get("category") or "Outros",
                tag=t.get("tag"),
                date=date.fromisoformat(tx_date),
                is_recurring=bool(t.get("isRecurring")),
                source="import",
            )
            db.add(tx)
            created += 1

    db.commit()
    return created
