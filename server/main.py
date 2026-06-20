import os
import re
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# 네이버 지역검색을 대신 호출해 주는 작은 프록시.
# Client ID/Secret 은 서버 환경변수로만 보관되고 앱(브라우저)에는 노출되지 않습니다.

NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")
# 쉼표로 여러 개. 예: "https://date-diary.example.com,http://localhost:5173"
ALLOW_ORIGIN = os.environ.get("ALLOW_ORIGIN", "*")

app = FastAPI(title="date-diary place proxy")

_origins = ["*"] if ALLOW_ORIGIN.strip() == "*" else [o.strip() for o in ALLOW_ORIGIN.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def parse_region(addr: str) -> str:
    """주소 문자열에서 행정구역(구 > 시 > 군) 한 단계를 추출."""
    for pat in (r"([가-힣]+구)(?:\s|$)", r"([가-힣]+시)(?:\s|$)", r"([가-힣]+군)(?:\s|$)"):
        m = re.search(pat, addr or "")
        if m:
            return m.group(1)
    return ""


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/api/place/search")
async def search(query: str = Query(..., min_length=1)):
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="NAVER_CLIENT_ID/SECRET 환경변수가 없습니다.")

    url = "https://openapi.naver.com/v1/search/local.json"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": query, "display": 5, "sort": "random"}

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, headers=headers, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"네이버 호출 실패: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"네이버 API 오류 {r.status_code}: {r.text}")

    items = []
    for it in r.json().get("items", []):
        name = re.sub(r"<[^>]+>", "", it.get("title", ""))
        address = it.get("roadAddress") or it.get("address") or ""
        mapx, mapy = it.get("mapx"), it.get("mapy")
        items.append(
            {
                "name": name,
                "address": address,
                "roadAddress": it.get("roadAddress", ""),
                "category": it.get("category", ""),
                "region": parse_region(address),
                # mapx/mapy = 경도/위도 * 1e7 (WGS84)
                "lng": float(mapx) / 1e7 if mapx else None,
                "lat": float(mapy) / 1e7 if mapy else None,
                "link": it.get("link", ""),
            }
        )
    return {"items": items}
