// 앱 잠금: PIN(필수) + 지문/생체(WebAuthn, 선택)
// 주의: 이건 화면 잠금(스누핑 방지)이지 데이터 암호화는 아닙니다. 데이터는 그대로 IndexedDB에 있어요.

function buf2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b642buf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}
function rand(n = 16) {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return a
}

export function newSalt() {
  return buf2b64(rand(16).buffer)
}

export async function hashPin(pin, saltB64) {
  const data = new TextEncoder().encode(saltB64 + ':' + pin)
  const h = await crypto.subtle.digest('SHA-256', data)
  return buf2b64(h)
}

// 생체 인증(플랫폼 인증기 = 지문/Face) 사용 가능 여부
export async function bioAvailable() {
  try {
    if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// 지문 등록 → 자격증명 id(base64) 반환. 서버가 없으므로 id만 저장하고,
// 잠금해제 때 이 인증기로 사용자 검증이 성공하면 통과시키는 로컬 게이트 방식.
export async function registerBiometric() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: rand(32),
      rp: { name: '위드먼치', id: location.hostname },
      user: { id: rand(16), name: 'munch', displayName: '위드먼치' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })
  return buf2b64(cred.rawId)
}

// 지문으로 잠금 해제 (성공 시 resolve, 실패/취소 시 throw)
export async function verifyBiometric(credIdB64) {
  await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      allowCredentials: [{ type: 'public-key', id: b642buf(credIdB64) }],
      userVerification: 'required',
      timeout: 60000,
    },
  })
  return true
}
