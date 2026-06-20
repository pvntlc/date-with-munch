import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { formatDate } from '../utils.js'

const WD = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const base = value ? new Date(value + 'T00:00:00') : new Date()
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() })

  // 바깥 클릭하면 닫기
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function openCal() {
    const b = value ? new Date(value + 'T00:00:00') : new Date()
    setCursor({ y: b.getFullYear(), m: b.getMonth() })
    setOpen(true)
  }

  function move(delta) {
    setCursor((c) => {
      const nm = c.m + delta
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  const startPad = new Date(cursor.y, cursor.m, 1).getDay()
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const todayISO = toISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  function pick(d) {
    onChange(toISO(cursor.y, cursor.m, d))
    setOpen(false)
  }

  return (
    <div className="datepicker" ref={wrapRef}>
      <button type="button" className="dp-field" onClick={() => (open ? setOpen(false) : openCal())}>
        <Icon name="calendar" size={17} />
        <span>{value ? formatDate(value) : '날짜 선택'}</span>
      </button>

      {open && (
        <div className="dp-pop">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => move(-1)}>‹</button>
            <span className="dp-title">{cursor.y}년 {cursor.m + 1}월</span>
            <button type="button" className="dp-nav" onClick={() => move(1)}>›</button>
          </div>
          <div className="dp-grid dp-wd">
            {WD.map((w, i) => (
              <div key={w} className={'dp-wdi' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>{w}</div>
            ))}
          </div>
          <div className="dp-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={'p' + i} />
              const iso = toISO(cursor.y, cursor.m, d)
              return (
                <button
                  type="button"
                  key={iso}
                  className={'dp-day' + (iso === value ? ' sel' : '') + (iso === todayISO ? ' today' : '')}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
