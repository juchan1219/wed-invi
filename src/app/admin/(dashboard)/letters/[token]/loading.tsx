/** 편지와 하객 정보를 DB에서 읽는 동안 보여 주는 편집 화면 자리 표시자. */
export default function LoadingLetter() {
  return (
    <div className="pt-5" role="status" aria-live="polite">
      <p className="text-sm font-medium text-ink">편지 화면 불러오는 중…</p>
      <p className="mt-1 text-xs text-ink-faint">편집 화면을 준비하고 있습니다.</p>

      <div aria-hidden="true" className="mt-5 animate-pulse space-y-5 motion-reduce:animate-none">
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-paper-deep" />
            <div className="h-11 rounded-lg bg-paper-deep" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-paper-deep" />
            <div className="h-11 rounded-lg bg-paper-deep" />
          </div>
        </div>
        <div className="h-9 w-36 rounded bg-paper-deep" />
        <div className="h-80 rounded-lg bg-paper-deep" />
        <div className="h-11 rounded-lg bg-paper-deep" />
      </div>
    </div>
  );
}
