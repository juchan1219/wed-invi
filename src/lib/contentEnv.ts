/**
 * 전화번호·계좌번호를 환경변수에서 읽어 오기 위한 헬퍼.
 *
 * 왜 환경변수인가: 이 저장소는 **공개**다. 번호를 소스에 적으면 git 히스토리에
 * 영구히 남고, 공개 저장소를 긁는 수집기의 대상이 된다. 사이트에서는 어차피
 * 하객에게 보이는 값이지만, 저장소에 남기지 않는 것만으로 그 경로가 사라진다.
 *
 * `NEXT_PUBLIC_` 접두사가 붙으므로 **비밀이 아니다** — 빌드 시 번들에 인라인되어
 * 브라우저에 그대로 실린다. 비밀을 넣는 용도가 아니라, 공개할 값을 공개 저장소
 * 밖에 두는 용도다. (docs/env.md 의 같은 경고와 혼동하지 말 것)
 */

/**
 * 빈 문자열·공백만 있는 값을 `undefined` 로 바꾼다.
 *
 * 빈 문자열을 그대로 통과시키면 번호 없는 `tel:` 링크가 생기거나 계좌 카드가
 * 빈칸으로 남는다. 둘 다 "등록된 연락처가 없습니다" 안내보다 나쁘다.
 * 2026-09-27 에 `NEXT_PUBLIC_SITE_URL` 을 값 없이 등록해 빌드가 깨진 것과 같은 유형이다.
 */
export function publicValue(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * 번호가 주어지지 않은 항목을 목록에서 뺀다.
 *
 * 환경변수를 아직 등록하지 않았을 때 계좌 카드가 빈칸으로 뜨는 대신
 * 아예 사라지게 해서, 누락을 눈으로 바로 알 수 있게 한다.
 */
export function withNumber<T extends { number: string | undefined }>(
  drafts: readonly T[],
): (T & { number: string })[] {
  return drafts.filter((draft): draft is T & { number: string } =>
    Boolean(draft.number?.trim()),
  );
}
