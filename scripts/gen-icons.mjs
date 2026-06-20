import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

// 미니멀 마크: 짙은 차콜 배경 + 겹친 두 원(커플) 라인. 하트 없음.
function svg(size, { maskable = false } = {}) {
  const r = size * (maskable ? 0.14 : 0.18) // 원 반지름
  const cy = size / 2
  const off = r * 0.62 // 두 원 중심 간격의 절반
  const sw = size * 0.035
  const bgRadius = maskable ? 0 : size * 0.22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${bgRadius}" fill="#18181b"/>
  <circle cx="${size / 2 - off}" cy="${cy}" r="${r}" fill="none" stroke="#fafafa" stroke-width="${sw}"/>
  <circle cx="${size / 2 + off}" cy="${cy}" r="${r}" fill="none" stroke="#fafafa" stroke-width="${sw}"/>
</svg>`
}

const jobs = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 64 },
]

for (const j of jobs) {
  await sharp(Buffer.from(svg(j.size, { maskable: j.maskable })))
    .png()
    .toFile(`public/icons/${j.name}`)
  console.log('✓', j.name)
}
