import json
import os
import urllib.error
import urllib.request

RESPONSES_URL = "https://api.openai.com/v1/responses"

class OpenAIError(RuntimeError):
    pass

def _extract_output_text(payload: dict) -> str:
    chunks = []
    for item in payload.get("output", []):
        if item.get("type") != "message":
            continue
        for c in item.get("content", []):
            if c.get("type") == "output_text" and isinstance(c.get("text"), str):
                chunks.append(c["text"])
    if not chunks and isinstance(payload.get("output_text"), str):
        return payload["output_text"]
    return "\n".join(chunks).strip()

def responses_create(*, model: str, system_text: str, user_text: str,
                     tools=None, json_schema=None, schema_name="result") -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise OpenAIError("OPENAI_API_KEY is missing.")
    if not model:
        raise OpenAIError("OPENAI_MODEL/model input is missing.")

    body = {
        "model": model,
        "store": False,
        "input": [
            {"role": "system", "content": [{"type": "input_text", "text": system_text}]},
            {"role": "user", "content": [{"type": "input_text", "text": user_text}]}
        ]
    }
    if tools:
        body["tools"] = tools
    if json_schema:
        body["text"] = {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": json_schema
            }
        }

    req = urllib.request.Request(
        RESPONSES_URL,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "p20-content-engine-v1/0.1"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=900) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise OpenAIError(f"OpenAI HTTP {e.code}: {detail[:2000]}") from e
    except urllib.error.URLError as e:
        raise OpenAIError(f"OpenAI network error: {e}") from e

    text = _extract_output_text(payload)
    if not text:
        raise OpenAIError("Responses API returned no output text.")
    return text
