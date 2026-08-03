/**
 * 청첩장 껍데기. 데스크톱에서도 모바일 폭을 유지해 카드처럼 보이게 한다.
 * 관리자 화면(/admin)은 이 래퍼를 쓰지 않아서 화면을 넓게 쓸 수 있다.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-sheet bg-paper shadow-[0_0_40px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}
