import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { getAllEntries, getSettings, replaceAll, mergeEntries } from '../db.js'
import { blobToDataURL, dataURLToBlob } from '../utils.js'

const BACKUP_VERSION = 1

export default function MoreView({ entries, settings, onSaveSettings, onChanged }) {
  const [storage, setStorage] = useState(null)
  const [persisted, setPersisted] = useState(null)
  const [busy, setBusy] = useState('')
  const [apiBase, setApiBase] = useState(settings?.placeApiBase || '')
  const fileRef = useRef(null)

  async function refreshStorage() {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      setStorage(est)
    }
    if (navigator.storage?.persisted) {
      setPersisted(await navigator.storage.persisted())
    }
  }

  useEffect(() => {
    refreshStorage()
  }, [entries])

  async function requestPersist() {
    if (navigator.storage?.persist) {
      const ok = await navigator.storage.persist()
      setPersisted(ok)
      alert(ok ? '영구 저장이 켜졌어요. 이제 데이터가 더 안전하게 보관됩니다.' : '브라우저가 거절했어요. 홈화면에 앱을 설치하면 보통 자동으로 켜집니다.')
    }
  }

  async function exportBackup() {
    setBusy('export')
    try {
      const all = await getAllEntries()
      const settings = await getSettings()
      // 사진 Blob → dataURL 로 직렬화
      const out = []
      for (const e of all) {
        const photos = []
        for (const p of e.photos || []) {
          photos.push({ id: p.id, name: p.name, data: await blobToDataURL(p.blob) })
        }
        out.push({ ...e, photos })
      }
      const payload = {
        app: 'date-diary',
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        settings,
        entries: out,
      }
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `데이트기록-백업-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('백업 실패: ' + err.message)
    } finally {
      setBusy('')
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const mode = confirm(
      '복원 방식을 선택하세요.\n\n[확인] = 현재 기록을 모두 지우고 백업으로 교체\n[취소] = 기존 기록은 두고 합치기(병합)'
    )
    setBusy('import')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.app !== 'date-diary' || !Array.isArray(data.entries)) {
        throw new Error('올바른 백업 파일이 아니에요.')
      }
      // dataURL → Blob 복원
      const restored = []
      for (const e of data.entries) {
        const photos = []
        for (const p of e.photos || []) {
          photos.push({ id: p.id, name: p.name, blob: await dataURLToBlob(p.data) })
        }
        restored.push({ ...e, photos })
      }
      if (mode) {
        await replaceAll(restored, data.settings)
      } else {
        await mergeEntries(restored)
      }
      await onChanged()
      alert(`복원 완료! ${restored.length}개의 기록을 불러왔어요.`)
    } catch (err) {
      alert('복원 실패: ' + err.message)
    } finally {
      setBusy('')
    }
  }

  const usedMB = storage?.usage ? (storage.usage / 1048576).toFixed(1) : null

  return (
    <div className="more">
      <div className="more-card">
        <h3>백업 &amp; 복원</h3>
        <p className="muted">
          모든 기록과 사진을 파일 하나로 내보냅니다. 폰을 바꾸거나 앱을 다시 설치하기 전에
          백업해 두면 안전하게 복원할 수 있어요.
        </p>
        <div className="more-actions">
          <button className="btn primary" onClick={exportBackup} disabled={busy}>
            <Icon name="download" size={17} />
            {busy === 'export' ? '내보내는 중…' : '백업 파일 내보내기'}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={17} />
            {busy === 'import' ? '복원 중…' : '백업 파일에서 복원'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickFile} />
      </div>

      <div className="more-card">
        <h3>장소 검색 서버</h3>
        <p className="muted">
          네이버 장소 검색용 프록시 서버 주소를 넣으면, 기록 작성 시 장소를 검색해 고르고
          지역(구)이 자동으로 채워집니다. (server 폴더의 안내 참고)
        </p>
        <input
          className="input"
          placeholder="https://내서버주소 (또는 테스트용 mock)"
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
        />
        <div className="more-actions" style={{ marginTop: 10 }}>
          <button
            className="btn primary"
            onClick={async () => {
              await onSaveSettings({ ...settings, placeApiBase: apiBase.trim() })
              alert(apiBase.trim() ? '저장했어요. 이제 장소 검색을 쓸 수 있어요.' : '장소 검색을 껐어요.')
            }}
          >
            저장
          </button>
        </div>
      </div>

      <div className="more-card">
        <h3>저장소</h3>
        <p className="muted">
          데이터는 이 기기에만 저장됩니다.
          {usedMB && <> 현재 약 <strong>{usedMB}MB</strong> 사용 중.</>}
        </p>
        <p className="muted">
          영구 저장: {persisted == null ? '확인 중…' : persisted ? '켜짐' : '꺼짐 (브라우저가 공간 부족 시 지울 수 있음)'}
        </p>
        {!persisted && (
          <button className="btn" onClick={requestPersist}>영구 저장 켜기</button>
        )}
      </div>

      <p className="more-foot muted">우리의 데이트 기록 · 데이터는 100% 내 기기에</p>
    </div>
  )
}
