import { openDB } from 'idb'

const DB_NAME = 'date-diary'
const STORE = 'entries'
const META = 'meta'

const dbPromise = openDB(DB_NAME, 2, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(STORE)) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('date', 'date')
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains(META)) {
      db.createObjectStore(META, { keyPath: 'key' })
    }
  },
})

// 사진은 Blob 형태로 entry.photos 배열 안에 함께 저장됩니다.
// { id, blob, name } 형태. 화면에 그릴 때 URL.createObjectURL 로 변환.

export async function getAllEntries() {
  const db = await dbPromise
  const all = await db.getAll(STORE)
  // 날짜 내림차순 (최신 데이트가 위로)
  return all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export async function getEntry(id) {
  const db = await dbPromise
  return db.get(STORE, id)
}

export async function saveEntry(entry) {
  const db = await dbPromise
  await db.put(STORE, entry)
  return entry
}

export async function deleteEntry(id) {
  const db = await dbPromise
  await db.delete(STORE, id)
}

// ----- 설정(기념일 등) -----
const DEFAULT_SETTINGS = { startDate: '', anniversaries: [], coupleName: '', placeApiBase: '' }

export async function getSettings() {
  const db = await dbPromise
  const row = await db.get(META, 'settings')
  return { ...DEFAULT_SETTINGS, ...(row?.value || {}) }
}

export async function saveSettings(value) {
  const db = await dbPromise
  await db.put(META, { key: 'settings', value })
  return value
}

// ----- 백업 / 복원 -----
export async function replaceAll(entries, settings) {
  const db = await dbPromise
  const tx = db.transaction([STORE, META], 'readwrite')
  await tx.objectStore(STORE).clear()
  for (const e of entries) await tx.objectStore(STORE).put(e)
  if (settings) await tx.objectStore(META).put({ key: 'settings', value: settings })
  await tx.done
}

export async function mergeEntries(entries) {
  const db = await dbPromise
  const tx = db.transaction(STORE, 'readwrite')
  for (const e of entries) await tx.objectStore(STORE).put(e)
  await tx.done
}

export function newId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random())
}
