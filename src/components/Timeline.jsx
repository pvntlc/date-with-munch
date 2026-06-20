import { useMemo, useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import { formatDate, MOODS, getPlaces } from '../utils.js'

function moodEmoji(v) {
  const m = MOODS.find((x) => x.value === v)
  return m ? m.emoji : ''
}

export default function Timeline({ entries, onOpen, onNew }) {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState(null)

  // 모든 태그 모으기 (빈도순)
  const allTags = useMemo(() => {
    const count = {}
    for (const e of entries) for (const a of e.activities || []) count[a] = (count[a] || 0) + 1
    return Object.keys(count).sort((a, b) => count[b] - count[a])
  }, [entries])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return entries.filter((e) => {
      if (tag && !(e.activities || []).includes(tag)) return false
      if (!needle) return true
      const pl = getPlaces(e).flatMap((p) => [p.name, p.region, p.review])
      const hay = [e.title, e.diary, ...(e.activities || []), ...pl].join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [entries, q, tag])

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="glyph"><Icon name="book" size={40} /></div>
        <h2>아직 기록이 없어요</h2>
        <p>둘이 함께한 첫 데이트를 기록해 볼까요?</p>
        <button className="btn primary" onClick={onNew}>첫 기록 남기기</button>
      </div>
    )
  }

  const places = new Set(entries.flatMap((e) => getPlaces(e).map((p) => p.name)).filter(Boolean)).size
  const photos = entries.reduce((n, e) => n + (e.photos?.length || 0), 0)

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="num">{entries.length}</div>
          <div className="lbl">함께한 날</div>
        </div>
        <div className="stat">
          <div className="num">{places}</div>
          <div className="lbl">다녀온 장소</div>
        </div>
        <div className="stat">
          <div className="num">{photos}</div>
          <div className="lbl">남긴 사진</div>
        </div>
      </div>

      <div className="search">
        <Icon name="search" size={18} />
        <input
          className="search-input"
          placeholder="제목·장소·일기·태그 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && <button className="search-clear" onClick={() => setQ('')}>×</button>}
      </div>

      {allTags.length > 0 && (
        <div className="filter-tags">
          <button className={'ftag' + (tag === null ? ' active' : '')} onClick={() => setTag(null)}>
            전체
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              className={'ftag' + (tag === t ? ' active' : '')}
              onClick={() => setTag(tag === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="glyph"><Icon name="search" size={32} /></div>
          <p>검색 결과가 없어요.</p>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((e) => {
            const pls = getPlaces(e)
            const region = pls.find((p) => p.region)?.region
            return (
              <article key={e.id} className="card" onClick={() => onOpen(e.id)}>
                {e.photos?.length ? (
                  <div className="card-cover">
                    <Photo blob={e.photos[0].blob} alt={e.title} />
                    {e.photos.length > 1 && (
                      <span className="count"><Icon name="image" size={13} /> {e.photos.length}</span>
                    )}
                  </div>
                ) : (
                  <div className="card-cover empty"><Icon name="image" size={32} /></div>
                )}
                <div className="card-body">
                  <div className="card-meta">
                    <span>{formatDate(e.date)}</span>
                    {region ? <span>· {region}</span> : null}
                    {e.mood ? <span>· {moodEmoji(e.mood)}</span> : null}
                  </div>
                  <h3 className="card-title">{e.title || '제목 없는 데이트'}</h3>
                  {pls.length > 0 && (
                    <div className="card-place">
                      <Icon name="pin" size={14} /> {pls[0].name}
                      {pls.length > 1 ? ` 외 ${pls.length - 1}곳` : ''}
                    </div>
                  )}
                  {e.activities?.length > 0 && (
                    <div className="tagrow">
                      {e.activities.slice(0, 4).map((a) => (
                        <span key={a} className="tag">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
