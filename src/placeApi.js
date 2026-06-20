// 장소 검색: 더보기에서 설정한 프록시 서버(base)로 요청합니다.
// base 가 'mock' 이면 키/서버 없이도 UI를 테스트할 수 있는 더미 결과를 돌려줍니다.

const MOCK = [
  { name: '블루보틀 성수', address: '서울 성동구 아차산로 7', region: '성동구', lat: 37.542, lng: 127.044, category: '카페' },
  { name: '성수연방', address: '서울 성동구 성수이로14길 14', region: '성동구', lat: 37.541, lng: 127.056, category: '복합문화공간' },
  { name: '스타벅스 강남대로점', address: '서울 강남구 강남대로 390', region: '강남구', lat: 37.497, lng: 127.027, category: '카페' },
  { name: '정식당', address: '서울 강남구 선릉로158길 11', region: '강남구', lat: 37.525, lng: 127.04, category: '음식점' },
  { name: '경포대', address: '강원 강릉시 강문동', region: '강릉시', lat: 37.795, lng: 128.906, category: '관광' },
]

export function isConfigured(base) {
  return !!(base && base.trim())
}

export async function searchPlaces(base, query) {
  const q = query.trim()
  if (!q) return []
  if (!isConfigured(base)) throw new Error('장소 검색 서버가 설정되지 않았어요.')

  if (base.trim() === 'mock') {
    await new Promise((r) => setTimeout(r, 250))
    return MOCK.filter((m) => (m.name + m.address).includes(q))
  }

  const url = base.replace(/\/$/, '') + '/api/place/search?query=' + encodeURIComponent(q)
  const res = await fetch(url)
  if (!res.ok) {
    let msg = `검색 실패 (${res.status})`
    try {
      const d = await res.json()
      if (d.error) msg = d.error
    } catch {}
    throw new Error(msg)
  }
  const data = await res.json()
  return data.items || []
}
