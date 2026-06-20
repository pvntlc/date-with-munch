import { useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { formatDate, MOODS, naverMapUrl, getPlaces } from '../utils.js'

export default function EntryDetail({ entry, onBack, onEdit, onDelete }) {
  const [zoom, setZoom] = useState(null) // 확대해서 볼 사진 blob
  const mood = MOODS.find((m) => m.value === entry.mood)
  const photos = entry.photos || []
  const places = getPlaces(entry)

  return (
    <div>
      <button className="btn ghost back-btn" onClick={onBack}><Icon name="back" size={18} /> 목록으로</button>

      {photos.length > 0 && (
        <div className={'gallery' + (photos.length > 1 ? ' multi' : '')} style={{ marginTop: 14 }}>
          {photos.map((p) => (
            <Photo
              key={p.id}
              blob={p.blob}
              alt={entry.title}
              className={photos.length === 1 ? 'solo' : ''}
              onClick={() => setZoom(p.blob)}
            />
          ))}
        </div>
      )}

      <div className="detail-head">
        <h1 className="detail-title">{entry.title || '제목 없는 데이트'}</h1>
        <div className="detail-sub">
          <span><Icon name="calendar" size={15} /> {formatDate(entry.date)}</span>
          {mood && <span>{mood.emoji} {mood.label}</span>}
        </div>
      </div>

      {places.length > 0 && (
        <div className="section">
          <h3>다녀온 장소 {places.length > 1 ? `· ${places.length}곳` : ''}</h3>
          <div className="place-list">
            {places.map((p) => (
              <div key={p.id} className="place-card">
                <div className="place-card-head">
                  <div className="place-card-name">
                    <strong>{p.name}</strong>
                    {p.region && <span className="picked-region">{p.region}</span>}
                  </div>
                  <a
                    className="course-map"
                    href={naverMapUrl((p.region ? p.region + ' ' : '') + p.name)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="네이버 지도에서 보기"
                    title="네이버 지도에서 보기"
                  >
                    <Icon name="map" size={18} />
                  </a>
                </div>
                {p.address && <div className="muted place-card-addr">{p.address}</div>}
                {p.rating > 0 && <StarRating value={p.rating} size={18} readOnly />}
                {p.review?.trim() && <p className="place-card-review">{p.review}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.activities?.length > 0 && (
        <div className="section">
          <h3>함께 한 것</h3>
          <div className="tagrow">
            {entry.activities.map((a) => (
              <span key={a} className="tag">{a}</span>
            ))}
          </div>
        </div>
      )}

      {entry.diary?.trim() && (
        <div className="section">
          <h3>그날의 일기</h3>
          <p className="diary-text">{entry.diary}</p>
        </div>
      )}

      <div className="detail-foot">
        <button className="btn" onClick={onEdit}>수정</button>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('이 기록을 삭제할까요? 되돌릴 수 없어요.')) onDelete(entry.id)
          }}
        >
          삭제
        </button>
      </div>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <Photo blob={zoom} alt="" />
        </div>
      )}
    </div>
  )
}
