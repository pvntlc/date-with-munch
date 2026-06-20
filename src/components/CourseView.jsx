import { useMemo } from 'react'
import Icon from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { naverMapUrl, shortDate, getPlaces } from '../utils.js'

const NO_REGION = '지역 미지정'

export default function CourseView({ entries, onOpen }) {
  const groups = useMemo(() => {
    // (장소, 그 기록) 쌍을 지역별로 모음
    const byRegion = {}
    for (const e of entries) {
      for (const pl of getPlaces(e)) {
        if (!pl.name?.trim()) continue
        const region = pl.region?.trim() || NO_REGION
        ;(byRegion[region] ||= []).push({ entry: e, pl })
      }
    }
    return Object.entries(byRegion)
      .map(([region, list]) => {
        // 같은 장소 이름 묶기 (entries는 최신순 정렬 유지)
        const placeMap = {}
        for (const { entry, pl } of list) {
          const place = pl.name.trim()
          if (!placeMap[place]) placeMap[place] = { place, visits: [] }
          placeMap[place].visits.push({ entry, pl })
        }
        const places = Object.values(placeMap)
        return { region, places, count: places.length }
      })
      .sort((a, b) => {
        if (a.region === NO_REGION) return 1
        if (b.region === NO_REGION) return -1
        return b.count - a.count
      })
  }, [entries])

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <div className="glyph"><Icon name="map" size={40} /></div>
        <h2>아직 코스가 없어요</h2>
        <p>기록에 장소를 적으면 지역별로 자동 정리돼요.</p>
      </div>
    )
  }

  return (
    <div className="course">
      {groups.map((g) => (
        <section key={g.region} className="course-region">
          <div className="course-region-head">
            <h3>
              <Icon name="pin" size={16} /> {g.region}
            </h3>
            <span className="muted">{g.count}곳</span>
          </div>
          <div className="course-places">
            {g.places.map((p) => {
              const latest = p.visits[0].entry
              const rating = p.visits[0].pl.rating || 0
              const query = (g.region !== NO_REGION ? g.region + ' ' : '') + p.place
              return (
                <div key={p.place} className="course-place">
                  <button className="course-place-main" onClick={() => onOpen(latest.id)}>
                    <span className="course-place-name">
                      {p.place}
                      {rating > 0 && <StarRating value={rating} size={13} readOnly />}
                    </span>
                    <span className="muted course-place-meta">
                      {shortDate(latest.date)}
                      {p.visits.length > 1 ? ` · ${p.visits.length}번 방문` : ''}
                      {latest.title ? ` · ${latest.title}` : ''}
                    </span>
                  </button>
                  <a
                    className="course-map"
                    href={naverMapUrl(query)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${p.place} 네이버 지도에서 보기`}
                    title="네이버 지도에서 보기"
                  >
                    <Icon name="map" size={18} />
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
