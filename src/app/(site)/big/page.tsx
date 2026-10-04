import type { Metadata } from "next";
import { Invitation } from "@/components/invitation/Invitation";

/**
 * 어르신용 큰 글씨 청첩장 (2026-10-05 사용자 요청).
 *
 * 기본 청첩장(`/`)과 **같은 컴포넌트**를 쓴다. 섹션을 추가할 때 한쪽만 빠지는 일이
 * 없도록 하려는 것이다. 차이는 글자 배율 하나뿐이다.
 *
 * 배율은 `globals.css` 의 `.large-type` 이 글자 크기 토큰에 곱하는 `--text-scale` 로 전달한다.
 * 클래스와 인라인 스타일이 **같은 요소** 에 있어야 한다 — 커스텀 속성 안의 `var()` 는
 * 선언 지점에서 치환되므로, 토큰을 `@theme` 에 두면 배율이 먹지 않는다(globals.css 주석 참고).
 * 춤 스토리는 자기 CSS 모듈의 값을 쓰므로 이 배율을 타지 않는다 — 춤 문구를 키우면
 * 캐릭터·엔딩 그림·편지 버튼과 겹칠 수 있어 일부러 분리했다(`docs/requirements.md`).
 *
 * 개인화 편지(`/i/<토큰>`)와는 조합하지 않는다. 어르신은 기본 초대장만 받으신다는
 * 확인을 받았다. 필요해지면 이 배율을 쿼리 파라미터로 바꿔 두 경로에 얹을 수 있다.
 */
export const metadata: Metadata = {
  // 검색 노출이 필요한 주소가 아니다. 하객에게 직접 보내는 링크다.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="large-type" style={{ "--text-scale": "1.25" } as React.CSSProperties}>
      <Invitation largeType />
    </div>
  );
}
