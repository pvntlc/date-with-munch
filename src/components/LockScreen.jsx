import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { hashPin, verifyBiometric } from '../lock.js'

export default function LockScreen({ lock, onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [bioBusy, setBioBusy] = useState(false)

  const maxLen = lock.pinLen || 6

  async function tryBio() {
    if (!lock.bioCredId) return
    setBioBusy(true)
    setError('')
    try {
      await verifyBiometric(lock.bioCredId)
      onUnlock()
    } catch {
      setError('지문 인증에 실패했어요. PIN으로 입력해 주세요.')
    } finally {
      setBioBusy(false)
    }
  }

  // 지문이 등록돼 있으면 진입 시 한 번 자동 시도
  useEffect(() => {
    if (lock.bioCredId) tryBio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submit(value) {
    const h = await hashPin(value, lock.pinSalt)
    if (h === lock.pinHash) {
      onUnlock()
    } else {
      setError('PIN이 일치하지 않아요')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      setPin('')
    }
  }

  function press(d) {
    setError('')
    const next = (pin + d).slice(0, maxLen)
    setPin(next)
    if (next.length === maxLen) submit(next)
  }
  function del() {
    setError('')
    setPin((p) => p.slice(0, -1))
  }

  const dots = Array.from({ length: maxLen }, (_, i) => i < pin.length)

  return (
    <div className="lockscreen">
      <div className="lock-top">
        <div className="lock-logo"><Icon name="lock" size={26} /></div>
        <h2>위드먼치</h2>
        <p className="muted">PIN을 입력해 잠금을 해제하세요</p>
      </div>

      <div className={'pin-dots' + (shake ? ' shake' : '')}>
        {dots.map((on, i) => (
          <span key={i} className={'pin-dot' + (on ? ' on' : '')} />
        ))}
      </div>
      <div className="lock-error">{error || ' '}</div>

      <div className="pinpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className="pinkey" onClick={() => press(String(n))}>{n}</button>
        ))}
        <button
          className="pinkey ghost"
          onClick={tryBio}
          disabled={!lock.bioCredId || bioBusy}
          aria-label="지문으로 잠금 해제"
        >
          {lock.bioCredId ? <Icon name="fingerprint" size={26} /> : ''}
        </button>
        <button className="pinkey" onClick={() => press('0')}>0</button>
        <button className="pinkey ghost" onClick={del} aria-label="지우기">
          <Icon name="back" size={24} />
        </button>
      </div>
    </div>
  )
}
