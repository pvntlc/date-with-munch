import { useRef, useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import PlacePicker from './PlacePicker.jsx'
import StarRating from './StarRating.jsx'
import { MOODS, todayISO, compressImage, REGION_SUGGEST, getPlaces } from '../utils.js'
import { isConfigured } from '../placeApi.js'
import { newId } from '../db.js'

const SUGGESTIONS = ['맛집', '카페', '영화', '드라이브', '산책', '쇼핑', '전시', '여행', '집데이트', '술집']

export default function EntryForm({ initial, onSave, onCancel, regions = [], placeApiBase = '' }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || todayISO())
  const [places, setPlaces] = useState(() =>
    getPlaces(initial).map((p) => ({ ...p, id: p.id === 'legacy' ? newId() : p.id }))
  )
  const [adding, setAdding] = useState(false) // 장소 추가 중(검색/입력 패널 표시)
  const [manualAdd, setManualAdd] = useState(!isConfigured(placeApiBase))
  const [manualName, setManualName] = useState('')
  const [manualRegion, setManualRegion] = useState('')
  const [mood, setMood] = useState(initial?.mood || 0)
  const [activities, setActivities] = useState(initial?.activities || [])
  const [diary, setDiary] = useState(initial?.diary || '')
  const [photos, setPhotos] = useState(initial?.photos || [])
  const [tagDraft, setTagDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  function addTag(raw) {
    const t = raw.trim()
    if (!t) return
    if (!activities.includes(t)) setActivities([...activities, t])
    setTagDraft('')
  }

  function onTagKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagDraft)
    }
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      const added = []
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue
        const blob = await compressImage(f)
        added.push({ id: newId(), blob, name: f.name })
      }
      setPhotos((prev) => [...prev, ...added])
    } catch (err) {
      alert('사진을 추가하지 못했어요: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function addPlace(p) {
    setPlaces((prev) => [
      ...prev,
      {
        id: newId(),
        name: p.name.trim(),
        region: (p.region || '').trim(),
        address: p.address || '',
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        rating: 0,
        review: '',
      },
    ])
    setAdding(false)
    setManualName('')
    setManualRegion('')
  }
  function updatePlace(id, patch) {
    setPlaces((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function removePlace(id) {
    setPlaces((prev) => prev.filter((x) => x.id !== id))
  }
  function addManual() {
    if (!manualName.trim()) return
    addPlace({ name: manualName, region: manualRegion })
  }

  function submit() {
    if (!title.trim() && !diary.trim() && photos.length === 0 && places.length === 0) {
      alert('제목, 일기, 사진, 장소 중 하나는 채워 주세요 🙂')
      return
    }
    onSave({
      id: initial?.id || newId(),
      title: title.trim(),
      date,
      places: places.map((p) => ({ ...p, name: p.name.trim(), region: p.region.trim() })),
      mood,
      activities,
      diary,
      photos,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  }

  return (
    <div>
      <button className="btn ghost back-btn" onClick={onCancel}><Icon name="back" size={18} /> 취소</button>
      <h1 className="detail-title" style={{ marginTop: 10 }}>
        {initial ? '기록 수정' : '새 데이트 기록'}
      </h1>

      <div className="field">
        <label>사진</label>
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className="photo-thumb">
              <Photo blob={p.blob} alt="" />
              <button className="rm" onClick={() => removePhoto(p.id)} title="삭제">×</button>
            </div>
          ))}
          <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={busy}>
            <span className="plus">+</span>
            <span>{busy ? '추가 중…' : '사진'}</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onFiles}
        />
      </div>

      <div className="field">
        <label>제목</label>
        <input
          className="input"
          placeholder="예: 한강 야경 데이트"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label>날짜</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label>
          다녀온 장소 <span className="muted" style={{ fontWeight: 400 }}>· 여러 곳 + 별점·리뷰</span>
        </label>

        {/* 추가된 장소들 (각각 별점 + 리뷰) */}
        {places.map((p) => (
          <div key={p.id} className="place-edit">
            <div className="place-edit-head">
              <div className="place-edit-name">
                <strong>{p.name}</strong>
                {p.region && <span className="picked-region">{p.region}</span>}
                {p.address && <div className="muted picked-addr">{p.address}</div>}
              </div>
              <button type="button" className="rm-place" onClick={() => removePlace(p.id)} aria-label="장소 삭제">×</button>
            </div>
            <StarRating value={p.rating} onChange={(v) => updatePlace(p.id, { rating: v })} size={24} />
            <textarea
              className="textarea place-review"
              placeholder="이 장소 어땠어? (한 줄 리뷰)"
              value={p.review}
              onChange={(e) => updatePlace(p.id, { review: e.target.value })}
            />
          </div>
        ))}

        {/* 장소 추가 패널 */}
        {adding ? (
          <div className="place-add-panel">
            {isConfigured(placeApiBase) && !manualAdd ? (
              <PlacePicker base={placeApiBase} onPick={addPlace} />
            ) : (
              <>
                <input
                  className="input"
                  placeholder="장소 이름 (예: 여의도 한강공원)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManual())}
                />
                <input
                  className="input"
                  style={{ marginTop: 8 }}
                  placeholder="지역 (예: 강남구, 성수)"
                  value={manualRegion}
                  onChange={(e) => setManualRegion(e.target.value)}
                />
                <div className="chip-suggest">
                  {[...new Set([...regions, ...REGION_SUGGEST])]
                    .filter((r) => r && r !== manualRegion)
                    .slice(0, 10)
                    .map((r) => (
                      <button key={r} type="button" onClick={() => setManualRegion(r)}>+ {r}</button>
                    ))}
                </div>
                <button type="button" className="btn primary" style={{ marginTop: 10 }} onClick={addManual}>
                  추가
                </button>
              </>
            )}
            <div className="place-add-foot">
              {isConfigured(placeApiBase) && (
                <button type="button" className="link-toggle" onClick={() => setManualAdd((m) => !m)}>
                  {manualAdd ? '장소 검색으로' : '직접 입력'}
                </button>
              )}
              <button type="button" className="link-toggle" onClick={() => setAdding(false)}>닫기</button>
            </div>
          </div>
        ) : (
          <button type="button" className="place-add-btn" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> 장소 추가
          </button>
        )}
      </div>

      <div className="field">
        <label>그날의 기분</label>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={'mood' + (mood === m.value ? ' active' : '')}
              onClick={() => setMood(mood === m.value ? 0 : m.value)}
              type="button"
            >
              <div className="e">{m.emoji}</div>
              <div className="l">{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>함께 한 것</label>
        <div className="chip-input">
          {activities.map((a) => (
            <span key={a} className="chip">
              {a}
              <button onClick={() => setActivities(activities.filter((x) => x !== a))}>×</button>
            </span>
          ))}
          <input
            className="input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="입력 후 Enter"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKey}
          />
        </div>
        <div className="chip-suggest">
          {SUGGESTIONS.filter((s) => !activities.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => addTag(s)}>+ {s}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>일기</label>
        <textarea
          className="textarea"
          placeholder="오늘 어땠어? 기억하고 싶은 순간을 적어봐요."
          value={diary}
          onChange={(e) => setDiary(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="btn" onClick={onCancel}>취소</button>
        <button className="btn primary" onClick={submit} disabled={busy}>저장</button>
      </div>
    </div>
  )
}
