# 장소 검색 프록시 (네이버 지역검색 · FastAPI)

PWA가 직접 호출할 수 없는 네이버 검색 API를 대신 호출해 주는 작은 FastAPI 서버입니다.
네이버 Client ID/Secret 은 이 서버의 환경변수로만 보관되고 앱(브라우저)에는 노출되지 않습니다.
기존 stock-manager 서버(FastAPI + nginx + systemd, Oracle Cloud)와 같은 방식으로 얹습니다.

## 1) 네이버 키 발급
1. https://developers.naver.com/apps/#/register → 애플리케이션 등록
2. 사용 API에서 **검색** 선택
3. 환경 추가 → **WEB 설정** (서비스 URL은 아무 값, 예: `http://localhost`)
4. 발급된 **Client ID / Client Secret** 복사  (검색 API 일 25,000회 무료)

## 2) 서버에 올리기 (systemd)
```bash
sudo mkdir -p /opt/date-diary-place && cd /opt/date-diary-place
# 이 폴더(main.py, requirements.txt)를 업로드 (scp/git 등)

python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cp .env.example .env      # 값 채우기 (CLIENT_ID/SECRET, ALLOW_ORIGIN)

sudo cp date-diary-place.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now date-diary-place
systemctl status date-diary-place        # active 확인
curl http://127.0.0.1:8011/health         # {"ok":true}
```
서비스는 `127.0.0.1:8011` 에서만 떠 있고, 외부 노출은 아래 nginx가 담당합니다.

## 3) nginx 연결 (HTTPS 재사용)
이미 쓰는 nginx 서버 블록에 location 하나만 추가하세요. 고유 프리픽스(`/place-proxy/`)로
기존 `/api/` 등과 충돌을 피합니다. 끝의 `/` 가 프리픽스를 떼고 전달해 줍니다.
```nginx
location /place-proxy/ {
    proxy_pass http://127.0.0.1:8011/;
    proxy_set_header Host $host;
}
```
```bash
sudo nginx -t && sudo systemctl reload nginx
```
확인:
```bash
curl "https://<도메인>/place-proxy/api/place/search?query=성수동 카페"
```
`items` 배열이 오면 성공.

## 4) 앱에 연결
PWA → **더보기 → 장소 검색 서버** 에 `https://<도메인>/place-proxy` 입력 후 저장.
(앱이 `/api/place/search` 를 자동으로 붙입니다.)

## ⚠️ HTTPS / 도메인
- PWA를 https로 쓰면 이 프록시도 **https** 여야 호출됩니다(혼합콘텐츠 차단).
- stock-manager nginx에 이미 도메인+인증서가 있으면 그대로 재사용하면 끝.
- IP만 있고 도메인이 없다면: 무료 도메인(DuckDNS 등) + certbot(Let's Encrypt)로 인증서를 붙이거나,
  **이 PWA(dist/)도 같은 nginx에서 같은 도메인으로 서빙**하면 CORS·혼합콘텐츠 문제가 한 번에 사라집니다.

## API
`GET /api/place/search?query=<검색어>`
```json
{ "items": [
  { "name":"...", "address":"서울 강남구 ...", "region":"강남구",
    "lat":37.5, "lng":127.0, "category":"...", "link":"https://..." }
]}
```
`GET /health` → `{ "ok": true }`
