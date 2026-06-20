import { useEffect, useState } from 'react'
import { hashPin, newSalt, bioAvailable, registerBiometric } from '../lock.js'

export default function LockSettings({ settings, onSaveSettings }) {
  const lock = settings.lock || { enabled: false }
  const [mode, setMode] = useState(null) // null | 'setpin'
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [msg, setMsg] = useState('')
  const [canBio, setCanBio] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    bioAvailable().then(setCanBio)
  }, [])

  function reset() {
    setPin1('')
    setPin2('')
    setMsg('')
    setMode(null)
  }

  async function savePin(keepBio) {
    if (!/^\d{4,6}$/.test(pin1)) {
      setMsg('PIN은 숫자 4~6자리로 입력해 주세요.')
      return
    }
    if (pin1 !== pin2) {
      setMsg('두 번 입력한 PIN이 달라요.')
      return
    }
    const salt = newSalt()
    const pinHash = await hashPin(pin1, salt)
    await onSaveSettings({
      ...settings,
      lock: {
        enabled: true,
        pinSalt: salt,
        pinHash,
        pinLen: pin1.length,
        bioCredId: keepBio ? lock.bioCredId || '' : '',
      },
    })
    reset()
    setMsg('잠금이 설정됐어요.')
  }

  async function disableLock() {
    if (!confirm('앱 잠금을 끌까요?')) return
    await onSaveSettings({
      ...settings,
      lock: { enabled: false, pinHash: '', pinSalt: '', pinLen: 0, bioCredId: '' },
    })
    setMsg('잠금을 껐어요.')
  }

  async function enrollBio() {
    setBusy(true)
    setMsg('')
    try {
      const credId = await registerBiometric()
      await onSaveSettings({ ...settings, lock: { ...lock, bioCredId: credId } })
      setMsg('지문이 등록됐어요.')
    } catch (e) {
      setMsg('지문 등록에 실패했어요: ' + (e.message || '취소됨'))
    } finally {
      setBusy(false)
    }
  }

  async function removeBio() {
    await onSaveSettings({ ...settings, lock: { ...lock, bioCredId: '' } })
    setMsg('지문 등록을 해제했어요.')
  }

  return (
    <div className="more-card">
      <h3>앱 잠금</h3>
      <p className="muted">
        앱 열 때 PIN(또는 지문)으로 잠급니다. 폰을 잃어버리거나 누가 집어도 기록을 못 봐요.
        <br />※ 화면 잠금이라 데이터 자체를 암호화하진 않아요. 중요한 기록은 백업도 함께.
      </p>

      {!lock.enabled && mode !== 'setpin' && (
        <button className="btn primary" onClick={() => setMode('setpin')}>앱 잠금 켜기</button>
      )}

      {mode === 'setpin' && (
        <div className="pin-setup">
          <input
            className="input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="새 PIN (숫자 4~6자리)"
            value={pin1}
            onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
          />
          <input
            className="input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN 다시 입력"
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
          />
          <div className="more-actions" style={{ flexDirection: 'row' }}>
            <button className="btn" onClick={reset}>취소</button>
            <button className="btn primary" onClick={() => savePin(true)}>저장</button>
          </div>
        </div>
      )}

      {lock.enabled && mode !== 'setpin' && (
        <>
          <p className="lock-status">🔒 잠금 사용 중{lock.bioCredId ? ' · 지문 등록됨' : ''}</p>
          <div className="more-actions">
            <button className="btn" onClick={() => setMode('setpin')}>PIN 변경</button>
            {canBio && !lock.bioCredId && (
              <button className="btn" onClick={enrollBio} disabled={busy}>
                {busy ? '등록 중…' : '지문 등록'}
              </button>
            )}
            {lock.bioCredId && (
              <button className="btn" onClick={removeBio}>지문 해제</button>
            )}
            <button className="btn danger" onClick={disableLock}>잠금 끄기</button>
          </div>
          {!canBio && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>이 기기는 지문 인증을 지원하지 않아요(또는 https 설치 후 가능).</p>}
        </>
      )}

      {msg && <p className="lock-msg muted">{msg}</p>}
    </div>
  )
}
