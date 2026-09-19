/**
 * 손그림 선 굵기에 맞춘 봉투 아이콘(인라인 SVG). 닫힌 봉투에는 하트 봉인이 붙고,
 * 편지를 열면 열린 봉투로 바뀐다. 장식이라 스크린리더에서는 숨긴다.
 */
export function LetterIcon({ open = false }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M3.6 10.4v6.5c0 .9.7 1.6 1.6 1.6h13.6c.9 0 1.6-.7 1.6-1.6v-6.5" />
          <path d="M3.6 10.4 12 4.6l8.4 5.8" />
          <path d="M6.6 8.4V6.9c0-.5.4-.8.8-.8h9.2c.5 0 .8.3.8.8v1.5" />
          <path d="M3.9 17.9l6.2-4.6c1.1-.8 2.7-.8 3.8 0l6.2 4.6" />
        </>
      ) : (
        <>
          <path d="M3.6 7.3c0-.9.7-1.6 1.6-1.6h13.6c.9 0 1.6.7 1.6 1.6v9.4c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6z" />
          <path d="M4.1 6.6l6.9 5.5c.6.5 1.4.5 2 0l6.9-5.5" />
          <path
            d="M12 15.4s-2.2-1.3-2.2-2.8c0-.6.5-1.1 1.1-1.1.5 0 .9.3 1.1.7.2-.4.6-.7 1.1-.7.6 0 1.1.5 1.1 1.1 0 1.5-2.2 2.8-2.2 2.8z"
            fill="var(--letter-seal, #b85c55)"
            stroke="var(--letter-seal, #b85c55)"
            strokeWidth={0.8}
          />
        </>
      )}
    </svg>
  );
}
