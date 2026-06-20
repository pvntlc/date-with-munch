import { useRef, useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import PlacePicker from './PlacePicker.jsx'
import { MOODS, todayISO, compressImage, REGION_SUGGEST } from '../utils.js'
import { isConfigured } from '../placeApi.js'
import { newId } from '../db.js'

const SUGGESTIONS = ['맛집', '카페', '영화', '드라이브', '산책', '쇼핑', '전시', '여행', '집데이트', '술집']

export default function EntryForm({ initial, onSave, onCancel, regions = [], placeApiBase = '' }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || todayISO())
  const [place, setPlace] = useState(initial?.place || '')
  const [region, setRegion] = useState(initial?.region || '')
  const [address, setAddress] = useState(initial?.address || '')
  const [coords, setCoords] = useState(
    initial?.lat != null ? { lat: initial.lat, lng: initial.lng } : null
  )
  // 검색 서버가 있고, 아직 장소를 안 골랐으면 검색 모드로 시작
  const [manual, setManual] = useState(!isConfigured(placeApiBase) || !!initial?.place)
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

  function submit() {
    if (!title.trim() && !diary.trim() && photos.length === 0) {
      alert('제목, 일기, 사진 중 하나는 채워 주세요 🙂')
      return
    }
    onSave({
      id: initial?.id || newId(),
      title: title.trim(),
      date,
      place: place.trim(),
      region: region.trim(),
      address: address.trim(),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
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
          장소 <span className="muted" style={{ fontWeight: 400 }}>· 지역은 코스 정리에 쓰여요</span>
        </label>

        {isConfigured(placeApiBase) && !manual ? (
          place ? (
            // 검색으로 고른 장소 카드
            <div className="picked">
              <div className="picked-info">
                <strong>{place}</strong>
                {region && <span className="picked-region">{region}</span>}
                {address && <span className="muted picked-addr">{address}</span>}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setPlace('')
                  setRegion('')
                  setAddress('')
                  setCoords(null)
                }}
              >
                다시 검색
              </button>
            </div>
          ) : (
            <PlacePicker
              base={placeApiBase}
              onPick={(p) => {
                setPlace(p.name)
                setRegion(p.region || '')
                setAddress(p.address || '')
                setCoords(p.lat != null ? { lat: p.lat, lng: p.lng } : null)
              }}
            />
          )
        ) : (
          // 수동 입력 (검색 서버 미설정 또는 직접 입력 선택)
          <>
            <input
              className="input"
              placeholder="예: 여의도 한강공원"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <input
              className="input"
              style={{ marginTop: 8 }}
              placeholder="지역 (예: 강남구, 성수)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <div className="chip-suggest">
              {[...new Set([...regions, ...REGION_SUGGEST])]
                .filter((r) => r && r !== region)
                .slice(0, 12)
                .map((r) => (
                  <button key={r} type="button" onClick={() => setRegion(r)}>+ {r}</button>
                ))}
            </div>
          </>
        )}

        {isConfigured(placeApiBase) && (
          <button
            type="button"
            className="link-toggle"
            onClick={() => setManual((m) => !m)}
          >
            {manual ? '장소 검색으로 입력' : '직접 입력할래요'}
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
