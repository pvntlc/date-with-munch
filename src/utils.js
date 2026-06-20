// 날짜를 보기 좋은 한국어 형식으로
export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}.${d.getDate()}`
}

export function todayISO() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// 사진을 받아 최대 변(긴 쪽) 기준으로 리사이즈 + JPEG 압축해 Blob 으로 반환.
// 로컬 IndexedDB 용량을 아끼고 렌더링을 빠르게 합니다.
export function compressImage(file, maxSize = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width >= height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환 실패'))),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 불러올 수 없습니다'))
    }
    img.src = url
  })
}

export const MOODS = [
  { value: 5, emoji: '🥰', label: '최고' },
  { value: 4, emoji: '😊', label: '좋음' },
  { value: 3, emoji: '🙂', label: '보통' },
  { value: 2, emoji: '😕', label: '아쉬움' },
  { value: 1, emoji: '😢', label: '별로' },
]

// ---------- D-day 계산 ----------
const DAY = 86400000

function atMidnight(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// 두 날짜 사이의 '일수' (오늘이 시작일이면 1일째)
export function daysSince(startISO) {
  if (!startISO) return null
  const start = atMidnight(new Date(startISO + 'T00:00:00'))
  const today = atMidnight(new Date())
  return Math.floor((today - start) / DAY) + 1
}

// 사귄 시작일 기준 주요 기념일(100일 단위, 연 단위) 목록을 만들어 줍니다.
export function relationshipMilestones(startISO, count = 4) {
  if (!startISO) return []
  const start = atMidnight(new Date(startISO + 'T00:00:00'))
  const today = atMidnight(new Date())
  const passedDays = Math.floor((today - start) / DAY) + 1

  const targets = []
  // 100일 단위
  for (let n = 100; n <= 2000; n += 100) targets.push({ label: `${n}일`, day: n })
  // 1~10주년
  for (let y = 1; y <= 10; y++) targets.push({ label: `${y}주년`, day: y * 365 })

  return targets
    .map((t) => {
      const dateMs = start.getTime() + (t.day - 1) * DAY
      const remain = Math.round((atMidnight(new Date(dateMs)) - today) / DAY)
      return { ...t, dateISO: new Date(dateMs).toISOString().slice(0, 10), remain }
    })
    .filter((t) => t.day >= passedDays) // 아직 안 지난 것만
    .sort((a, b) => a.remain - b.remain)
    .slice(0, count)
}

// 매년 반복되는 기념일(생일 등)의 다음 도래일까지 D-day
export function nextAnniversary(dateISO, repeatYearly = true) {
  if (!dateISO) return null
  const base = atMidnight(new Date(dateISO + 'T00:00:00'))
  const today = atMidnight(new Date())
  if (!repeatYearly) {
    return { dateISO, remain: Math.round((base - today) / DAY) }
  }
  let next = new Date(today.getFullYear(), base.getMonth(), base.getDate())
  next = atMidnight(next)
  if (next < today) next = atMidnight(new Date(today.getFullYear() + 1, base.getMonth(), base.getDate()))
  return { dateISO: next.toISOString().slice(0, 10), remain: Math.round((next - today) / DAY) }
}

export function ddayLabel(remain) {
  if (remain === 0) return 'D-DAY'
  if (remain > 0) return `D-${remain}`
  return `D+${-remain}`
}

// ---------- 백업용 base64 변환 ----------
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export async function dataURLToBlob(dataURL) {
  const res = await fetch(dataURL)
  return res.blob()
}

// ---------- 네이버 지도 ----------
// 장소명(+지역)으로 네이버 지도 검색을 엽니다. 모바일/PC 모두 동작, API 키 불필요.
export function naverMapUrl(query) {
  return 'https://map.naver.com/p/search/' + encodeURIComponent(query.trim())
}

// 자주 쓰는 지역 추천 (사용자가 입력한 지역과 합쳐서 제안)
export const REGION_SUGGEST = [
  '강남', '성수', '홍대', '연남', '이태원', '종로', '을지로', '잠실',
  '여의도', '신촌', '건대', '강릉', '부산', '경주', '제주',
]
