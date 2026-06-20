import { useMemo, useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import { formatDate, MOODS } from '../utils.js'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ entries, onOpen }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() } // m: 0-11
  })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'

  // 날짜별 기록 묶음
  const byDate = useMemo(() => {
    const map = {}
    for (const e of entries) (map[e.date] ||= []).push(e)
    return map
  }, [entries])

  const first = new Date(cursor.y, cursor.m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const todayISO = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ d, iso })
  }

  function move(delta) {
    setSelected(null)
    setCursor((c) => {
      const nm = c.m + delta
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  const selectedEntries = selected ? byDate[selected] || [] : []
  const monthCount = cells.filter((c) => c && byDate[c.iso]).length

  return (
    <div>
      <div className="cal-head">
        <button className="btn ghost icon" onClick={() => move(-1)}>‹</button>
        <div className="cal-title">
          {cursor.y}년 {cursor.m + 1}월
          {monthCount > 0 && <span className="cal-badge">{monthCount}일 기록</span>}
        </div>
        <button className="btn ghost icon" onClick={() => move(1)}>›</button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={'cal-wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((c, i) => {
          if (!c) return <div key={'p' + i} className="cal-cell empty" />
          const list = byDate[c.iso]
          const cover = list?.find((e) => e.photos?.length)?.photos?.[0]?.blob
          return (
            <button
              key={c.iso}
              className={
                'cal-cell' +
                (c.iso === todayISO ? ' today' : '') +
                (selected === c.iso ? ' selected' : '') +
                (list ? ' has' : '')
              }
              onClick={() => setSelected(list ? c.iso : null)}
            >
              {cover ? (
                <Photo blob={cover} alt="" className="cal-thumb" />
              ) : (
                <span className="cal-day">{c.d}</span>
              )}
              {cover && <span className="cal-day over">{c.d}</span>}
              {list && !cover && <span className="cal-dot" />}
              {list && list.length > 1 && <span className="cal-count">{list.length}</span>}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="cal-day-list">
          <h3>{formatDate(selected)}</h3>
          {selectedEntries.map((e) => {
            const mood = MOODS.find((m) => m.value === e.mood)
            return (
              <button key={e.id} className="cal-day-item" onClick={() => onOpen(e.id)}>
                {e.photos?.[0] ? (
                  <Photo blob={e.photos[0].blob} alt="" className="cal-day-thumb" />
                ) : (
                  <span className="cal-day-thumb empty"><Icon name="image" size={20} /></span>
                )}
                <span className="cal-day-info">
                  <strong>{e.title || '제목 없는 데이트'}</strong>
                  <span className="muted">
                    {e.place ? <><Icon name="pin" size={13} /> {e.place}</> : null} {mood ? mood.emoji : ''}
                  </span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
