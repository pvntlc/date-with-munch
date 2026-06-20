# 배포 & 브랜치 전략

## 브랜치
- **develop** — 평소 작업/푸시하는 브랜치
- **main** — 배포 전용. `develop → main` PR(MR) 머지되면 **자동 배포**

```
작업 → develop 푸시 → main 으로 PR → 머지 → GitHub Actions 가 빌드+배포
```

## 자동 배포 동작 (.github/workflows/deploy.yml)
`main`에 커밋이 올라오면 GitHub Actions가:
1. `npm ci && npm run build`
2. 전용 `deploy` 키로 서버에 `rsync` (→ `/var/www/date-with-munch`)

서버의 `deploy` 유저는 **sudo 권한이 없고** 웹폴더만 갱신할 수 있어, 키가 유출돼도 피해가 제한됩니다.

## 최초 1회: GitHub Secrets 등록 (필수)
저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에서 4개 등록:

| 이름 | 값 |
|---|---|
| `DEPLOY_HOST` | `168.107.32.252` |
| `DEPLOY_PORT` | `2222` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | (아래에서 복사한 **개인키 전체**) |

### DEPLOY_SSH_KEY 값 가져오는 법
서버에 접속해서 개인키를 출력 → 통째로 복사해서 위 `DEPLOY_SSH_KEY` 에 붙여넣기:
```bash
ssh -i <키> -p 2222 ubuntu@168.107.32.252 "cat /home/ubuntu/deploy_key"
```
`-----BEGIN OPENSSH PRIVATE KEY-----` 부터 `-----END OPENSSH PRIVATE KEY-----` 까지 전부.

> 등록이 끝나면 보안을 위해 서버에서 개인키 사본을 지우세요:
> ```bash
> ssh -i <키> -p 2222 ubuntu@168.107.32.252 "shred -u /home/ubuntu/deploy_key /home/ubuntu/deploy_key.pub"
> ```
> (공개키는 이미 deploy 유저의 authorized_keys 에 등록돼 있어 지워도 됩니다.)

## 수동 배포가 필요할 때
Actions 탭 → **Deploy to server** → **Run workflow** (workflow_dispatch).

또는 로컬에서 직접:
```bash
npm run build
rsync -az --delete -e "ssh -p 2222 -i ~/.ssh/id_ed25519" dist/ deploy@168.107.32.252:/var/www/date-with-munch/
```
