import { useState } from 'react'
import {
  daysSince,
  relationshipMilestones,
  nextAnniversary,
  ddayLabel,
  formatDate,
} from '../utils.js'
import { newId } from '../db.js'
import DatePicker from './DatePicker.jsx'

export default function DdayView({ settings, onSave }) {
  const [startDate, setStartDate] = useState(settings.startDate || '')
  const [anniv, setAnniv] = useState(settings.anniversaries || [])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ title: '', date: '', repeatYearly: true })

  const dirty =
    startDate !== (settings.startDate || '') ||
    JSON.stringify(anniv) !== JSON.stringify(settings.anniversaries || [])

  function persist(next) {
    onSave({ ...settings, ...next })
  }

  function commitStart(v) {
    setStartDate(v)
    persist({ startDate: v, anniversaries: anniv })
  }

  function addAnniv() {
    if (!draft.title.trim() || !draft.date) return
    const next = [...anniv, { id: newId(), ...draft, title: draft.title.trim() }]
    setAnniv(next)
    persist({ startDate, anniversaries: next })
    setDraft({ title: '', date: '', repeatYearly: true })
    setAdding(false)
  }

  function removeAnniv(id) {
    const next = anniv.filter((a) => a.id !== id)
    setAnniv(next)
    persist({ startDate, anniversaries: next })
  }

  const days = daysSince(startDate)
  const milestones = relationshipMilestones(startDate, 3)

  // 사용자 기념일 + 다가오는 순 정렬
  const annivCards = anniv
    .map((a) => ({ ...a, ...nextAnniversary(a.date, a.repeatYearly) }))
    .filter((a) => a.remain != null)
    .sort((a, b) => a.remain - b.remain)

  return (
    <div className="dday">
      {/* 사귄 날 */}
      <div className="field">
        <label>처음 만난 날 / 사귀기 시작한 날</label>
        <DatePicker value={startDate} onChange={commitStart} />
      </div>

      {days != null && (
        <div className="dday-hero">
          <div className="dday-hero-label">우리 함께한 지</div>
          <div className="dday-hero-num">{days.toLocaleString()}<span>일</span></div>
          <div className="dday-hero-sub">{formatDate(startDate)}부터</div>
        </div>
      )}

      {milestones.length > 0 && (
        <>
          <h3 className="dday-section">다가오는 기념일</h3>
          <div className="dday-cards">
            {milestones.map((m) => (
              <div key={m.label} className="dday-card">
                <div className="dday-card-top">
                  <span className="dday-name">{m.label}</span>
                  <span className="dday-badge">{ddayLabel(m.remain)}</span>
                </div>
                <div className="dday-date muted">{formatDate(m.dateISO)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 사용자 지정 기념일 */}
      <h3 className="dday-section">
        나만의 기념일
        <button className="btn ghost icon" onClick={() => setAdding((v) => !v)}>
          {adding ? '닫기' : '+ 추가'}
        </button>
      </h3>

      {adding && (
        <div className="anniv-form">
          <input
            className="input"
            placeholder="예: 여자친구 생일"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <DatePicker value={draft.date} onChange={(d) => setDraft({ ...draft, date: d })} />
          <label className="check">
            <input
              type="checkbox"
              checked={draft.repeatYearly}
              onChange={(e) => setDraft({ ...draft, repeatYearly: e.target.checked })}
            />
            매년 반복
          </label>
          <button className="btn primary" onClick={addAnniv}>추가하기</button>
        </div>
      )}

      <div className="dday-cards">
        {annivCards.length === 0 && !adding && (
          <p className="muted" style={{ padding: '4px 2px' }}>
            생일·기념일을 추가하면 D-day가 표시돼요.
          </p>
        )}
        {annivCards.map((a) => (
          <div key={a.id} className="dday-card">
            <div className="dday-card-top">
              <span className="dday-name">{a.title}</span>
              <span className="dday-badge">{ddayLabel(a.remain)}</span>
            </div>
            <div className="dday-date muted">
              {formatDate(a.dateISO)} {a.repeatYearly ? '· 매년' : ''}
              <button className="link-del" onClick={() => removeAnniv(a.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
