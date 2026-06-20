// 가벼운 라인 아이콘 모음 (stroke = currentColor). 미니멀 톤 유지용.
const PATHS = {
  book: <path d="M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4Z M18 19H7a2 2 0 0 0-2 2" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16 M8 3v4 M16 3v4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16 M12 9v11" />
      <path d="M12 9S10.5 4.5 8 5.2C6.2 5.7 6.6 9 9 9h3Zm0 0s1.5-4.5 4-3.8C16.8 5.7 16.4 9 14 9h-2Z" />
    </>
  ),
  settings: <path d="M4 7h16 M4 12h16 M4 17h10" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="9" r="1.4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6.2v13.8l6-2.2 6 2.2 6-2.2V4l-6 2.2L9 4Z" />
      <path d="M9 4v13.8 M15 6.2V20" />
    </>
  ),
  external: <path d="M14 4h6v6 M20 4l-8 8 M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />,
  back: <path d="M15 19 8 12l7-7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  plus: <path d="M12 5v14 M5 12h14" />,
  calheart: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16 M8 3v4 M16 3v4" />
    </>
  ),
  download: <path d="M12 3v12 M7 10l5 5 5-5 M5 21h14" />,
  upload: <path d="M12 21V9 M7 14l5-5 5 5 M5 3h14" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 10a2 2 0 0 1 2 2c0 2.5-.4 4.5-1.2 6.2" />
      <path d="M9.5 5.5A5 5 0 0 1 17 10c0 1.5 0 3-.5 4.5" />
      <path d="M7 8a5 5 0 0 0-.9 2.9c0 2.2-.3 4.3-1.1 6.1" />
      <path d="M12 12c0 3-.5 5.5-1.5 7.8" />
      <path d="M20 13c.3-3.5-1-7-4-9a8 8 0 0 0-8 0" />
    </>
  ),
}

export default function Icon({ name, size = 20, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
