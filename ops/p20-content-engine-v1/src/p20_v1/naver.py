import json
import os
import urllib.parse
import urllib.request

TARGET_PATHS = {
    "news": "/v1/search/news.json",
    "blog": "/v1/search/blog.json",
    "cafearticle": "/v1/search/cafearticle.json",
    "webkr": "/v1/search/webkr.json"
}

def search(query: str, targets=None, display: int = 50):
    client_id = os.environ.get("NAVER_CLIENT_ID", "").strip()
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        return {"enabled": False, "reason": "NAVER_CLIENT_ID/SECRET missing", "results": []}

    targets = targets or ["news"]
    results = []
    for target in targets:
        path = TARGET_PATHS.get(target)
        if not path:
            continue
        params = urllib.parse.urlencode({
            "query": query,
            "display": max(1, min(display, 100)),
            "start": 1,
            "sort": "date" if target in {"news", "blog"} else "sim"
        })
        req = urllib.request.Request(
            "https://openapi.naver.com" + path + "?" + params,
            headers={
                "X-Naver-Client-Id": client_id,
                "X-Naver-Client-Secret": client_secret,
                "User-Agent": "p20-content-engine-v1/0.1"
            }
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        for item in payload.get("items", []):
            results.append({
                "target": target,
                "title": item.get("title"),
                "link": item.get("originallink") or item.get("link"),
                "description": item.get("description"),
                "published_at": item.get("pubDate") or item.get("postdate")
            })
    return {"enabled": True, "results": results}
