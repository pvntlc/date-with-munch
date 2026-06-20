import { useEffect, useState } from 'react'

// Blob 을 받아 object URL 로 변환해 보여주고, 언마운트 시 해제합니다.
export default function Photo({ blob, alt = '', className, onClick }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  if (!url) return null
  return <img src={url} alt={alt} className={className} onClick={onClick} loading="lazy" />
}
