import { useEffect, useState } from 'react'
import Timeline from './components/Timeline.jsx'
import CalendarView from './components/CalendarView.jsx'
import CourseView from './components/CourseView.jsx'
import DdayView from './components/DdayView.jsx'
import MoreView from './components/MoreView.jsx'
import EntryDetail from './components/EntryDetail.jsx'
import EntryForm from './components/EntryForm.jsx'
import LockScreen from './components/LockScreen.jsx'
import Icon from './components/Icon.jsx'
import { getAllEntries, getSettings, saveSettings, saveEntry, deleteEntry } from './db.js'
import { getPlaces } from './utils.js'

const TABS = [
  { key: 'timeline', label: '기록', icon: 'book' },
  { key: 'calendar', label: '달력', icon: 'calendar' },
  { key: 'course', label: '코스', icon: 'map' },
  { key: 'dday', label: '기념일', icon: 'gift' },
  { key: 'more', label: '더보기', icon: 'settings' },
]

export default function App() {
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState({ startDate: '', anniversaries: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('timeline')
  const [overlay, setOverlay] = useState(null) // {name:'detail'|'form', id?}
  // 한 번 잠금 해제하면 앱을 완전히 닫기 전까지(세션 동안) 다시 안 물어봄
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('unlocked') === '1')

  function unlock() {
    sessionStorage.setItem('unlocked', '1')
    setUnlocked(true)
  }

  async function refresh() {
    const [e, s] = await Promise.all([getAllEntries(), getSettings()])
    setEntries(e)
    setSettings(s)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  // 안드로이드/브라우저 뒤로가기로 오버레이(상세·작성)를 닫음 (앱이 꺼지지 않게)
  useEffect(() => {
    const onPop = () => setOverlay(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 목록에서 상세/작성으로 진입할 때 히스토리 항목을 하나 쌓음
  function openOverlay(o) {
    window.history.pushState({ ovl: 1 }, '')
    setOverlay(o)
  }
  // 오버레이를 닫고 목록으로 (쌓아둔 히스토리를 소비)
  function exitOverlay() {
    if (window.history.state?.ovl) window.history.back()
    else setOverlay(null)
  }

  // 로딩이 끝나면 잠금 여부 판단: 잠금이 꺼져 있으면 바로 통과
  useEffect(() => {
    if (!loading && !settings.lock?.enabled) setUnlocked(true)
  }, [loading, settings.lock?.enabled])

  const current = overlay?.id ? entries.find((e) => e.id === overlay.id) : null

  // 장소 검색 서버 주소: 설정값이 있으면 그걸, 없으면 앱이 호스팅된 같은 서버의 /place-proxy 를 기본 사용.
  // (배포 후 폰에서 별도 설정 없이 바로 장소 검색이 되도록)
  const placeApiBase =
    (settings.placeApiBase || '').trim() ||
    (typeof window !== 'undefined' ? window.location.origin + '/place-proxy' : '')

  // 입력 자동완성용: 이미 쓴 지역 목록 (빈도순)
  const regions = (() => {
    const count = {}
    for (const e of entries)
      for (const p of getPlaces(e))
        if (p.region?.trim()) count[p.region.trim()] = (count[p.region.trim()] || 0) + 1
    return Object.keys(count).sort((a, b) => count[b] - count[a])
  })()

  async function handleSave(entry) {
    await saveEntry(entry)
    await refresh()
    setOverlay({ name: 'detail', id: entry.id })
  }

  async function handleDelete(id) {
    await deleteEntry(id)
    await refresh()
    exitOverlay()
  }

  async function handleSaveSettings(value) {
    setSettings(value)
    await saveSettings(value)
  }

  const inOverlay = overlay && (overlay.name === 'form' || (overlay.name === 'detail' && current))

  // 잠금 화면 게이트
  if (!loading && settings.lock?.enabled && !unlocked) {
    return <LockScreen lock={settings.lock} onUnlock={unlock} />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-text">위드먼치</span>
            <img src="/munch.png" alt="먹고자" className="brand-munch" />
          </div>
          <div className="spacer" />
          {!inOverlay && (tab === 'timeline' || tab === 'calendar') && (
            <button className="btn primary" onClick={() => openOverlay({ name: 'form' })}>+ 기록</button>
          )}
        </div>
      </header>

      <main className="container">
        {loading ? (
          <div className="empty-state"><p>불러오는 중…</p></div>
        ) : inOverlay ? (
          overlay.name === 'form' ? (
            <EntryForm
              initial={current}
              regions={regions}
              placeApiBase={placeApiBase}
              onSave={handleSave}
              onCancel={() => (current ? setOverlay({ name: 'detail', id: current.id }) : exitOverlay())}
            />
          ) : (
            <EntryDetail
              entry={current}
              onBack={exitOverlay}
              onEdit={() => setOverlay({ name: 'form', id: current.id })}
              onDelete={handleDelete}
            />
          )
        ) : tab === 'timeline' ? (
          <Timeline
            entries={entries}
            onOpen={(id) => openOverlay({ name: 'detail', id })}
            onNew={() => openOverlay({ name: 'form' })}
          />
        ) : tab === 'calendar' ? (
          <CalendarView entries={entries} onOpen={(id) => openOverlay({ name: 'detail', id })} />
        ) : tab === 'course' ? (
          <CourseView entries={entries} onOpen={(id) => openOverlay({ name: 'detail', id })} />
        ) : tab === 'dday' ? (
          <DdayView settings={settings} onSave={handleSaveSettings} />
        ) : (
          <MoreView
            entries={entries}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onChanged={refresh}
          />
        )}
      </main>

      {!inOverlay && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={'tabitem' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} size={22} />
              <span className="ti-label">{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
