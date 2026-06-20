import { useState } from 'react'
import Photo from './Photo.jsx'
import Icon from './Icon.jsx'
import { formatDate, MOODS, naverMapUrl } from '../utils.js'

export default function EntryDetail({ entry, onBack, onEdit, onDelete }) {
  const [zoom, setZoom] = useState(null) // 확대해서 볼 사진 blob
  const mood = MOODS.find((m) => m.value === entry.mood)
  const photos = entry.photos || []

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
          {entry.place && (
            <span><Icon name="pin" size={15} /> {entry.region ? `${entry.region} · ` : ''}{entry.place}</span>
          )}
          {mood && <span>{mood.emoji} {mood.label}</span>}
        </div>
        {entry.place && (
          <a
            className="btn naver-btn"
            href={naverMapUrl((entry.region ? entry.region + ' ' : '') + entry.place)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="map" size={16} /> 네이버 지도에서 보기
            <Icon name="external" size={14} />
          </a>
        )}
      </div>

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
