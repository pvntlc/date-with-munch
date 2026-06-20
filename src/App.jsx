import { useEffect, useState } from 'react'
import Timeline from './components/Timeline.jsx'
import CalendarView from './components/CalendarView.jsx'
import CourseView from './components/CourseView.jsx'
import DdayView from './components/DdayView.jsx'
import MoreView from './components/MoreView.jsx'
import EntryDetail from './components/EntryDetail.jsx'
import EntryForm from './components/EntryForm.jsx'
import Icon from './components/Icon.jsx'
import { getAllEntries, getSettings, saveSettings, saveEntry, deleteEntry } from './db.js'

const TABS = [
  { key: 'timeline', label: '기록', icon: 'book' },
  { key: 'calendar', label: '달력', icon: 'calendar' },
  { key: 'course', label: '코스', icon: 'map' },
  { key: 'dday', label: '기념일', icon: 'gift' },
  { key: 'more', label: '더보기', icon: 'settings' },
]

const TITLES = {
  timeline: '우리의 데이트 기록',
  calendar: '달력',
  course: '지역별 코스',
  dday: '기념일 · D-day',
  more: '더보기',
}

export default function App() {
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState({ startDate: '', anniversaries: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('timeline')
  const [overlay, setOverlay] = useState(null) // {name:'detail'|'form', id?}

  async function refresh() {
    const [e, s] = await Promise.all([getAllEntries(), getSettings()])
    setEntries(e)
    setSettings(s)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const current = overlay?.id ? entries.find((e) => e.id === overlay.id) : null

  // 입력 자동완성용: 이미 쓴 지역 목록 (빈도순)
  const regions = (() => {
    const count = {}
    for (const e of entries) if (e.region?.trim()) count[e.region.trim()] = (count[e.region.trim()] || 0) + 1
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
    setOverlay(null)
  }

  async function handleSaveSettings(value) {
    setSettings(value)
    await saveSettings(value)
  }

  const inOverlay = overlay && (overlay.name === 'form' || (overlay.name === 'detail' && current))

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">{inOverlay ? '우리의 데이트 기록' : TITLES[tab]}</div>
          <div className="spacer" />
          {!inOverlay && (tab === 'timeline' || tab === 'calendar') && (
            <button className="btn primary" onClick={() => setOverlay({ name: 'form' })}>+ 기록</button>
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
              placeApiBase={settings.placeApiBase || ''}
              onSave={handleSave}
              onCancel={() => setOverlay(current ? { name: 'detail', id: current.id } : null)}
            />
          ) : (
            <EntryDetail
              entry={current}
              onBack={() => setOverlay(null)}
              onEdit={() => setOverlay({ name: 'form', id: current.id })}
              onDelete={handleDelete}
            />
          )
        ) : tab === 'timeline' ? (
          <Timeline
            entries={entries}
            onOpen={(id) => setOverlay({ name: 'detail', id })}
            onNew={() => setOverlay({ name: 'form' })}
          />
        ) : tab === 'calendar' ? (
          <CalendarView entries={entries} onOpen={(id) => setOverlay({ name: 'detail', id })} />
        ) : tab === 'course' ? (
          <CourseView entries={entries} onOpen={(id) => setOverlay({ name: 'detail', id })} />
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
