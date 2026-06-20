import { useState } from 'react'
import Icon from './Icon.jsx'
import { searchPlaces } from '../placeApi.js'

// 장소 검색 → 선택. 선택 시 onPick({ name, address, region, lat, lng }) 호출.
export default function PlacePicker({ base, onPick }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run() {
    if (!q.trim()) return
    setBusy(true)
    setErr('')
    try {
      const items = await searchPlaces(base, q)
      setResults(items)
    } catch (e) {
      setErr(e.message)
      setResults(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="picker">
      <div className="search">
        <Icon name="search" size={18} />
        <input
          className="search-input"
          placeholder="장소 이름 검색 (예: 블루보틀 성수)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), run())}
        />
        <button className="btn icon" onClick={run} disabled={busy} type="button">
          {busy ? '…' : '검색'}
        </button>
      </div>

      {err && <p className="picker-err">{err}</p>}

      {results && results.length === 0 && !err && (
        <p className="muted picker-empty">검색 결과가 없어요.</p>
      )}

      {results && results.length > 0 && (
        <div className="picker-results">
          {results.map((r, i) => (
            <button key={i} type="button" className="picker-item" onClick={() => onPick(r)}>
              <span className="picker-item-main">
                <strong>{r.name}</strong>
                <span className="muted">{r.address}</span>
              </span>
              {r.region && <span className="picker-region">{r.region}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
