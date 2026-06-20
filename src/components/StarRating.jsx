// 별점 ★ (1~5). readOnly면 표시 전용.
export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
  return (
    <div className={'stars' + (readOnly ? ' ro' : '')}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={'star' + (n <= value ? ' on' : '')}
          onClick={() => !readOnly && onChange?.(n === value ? 0 : n)}
          disabled={readOnly}
          aria-label={`${n}점`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.77l-5.7 3 1.08-6.35-4.62-4.5 6.39-.93z" />
          </svg>
        </button>
      ))}
    </div>
  )
}
