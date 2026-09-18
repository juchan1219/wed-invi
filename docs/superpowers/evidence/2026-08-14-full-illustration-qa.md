# 풀 일러스트 모바일 웨딩 스토리 — 최종 QA 증거

검증 대상: `codex/doodle-wedding-story`

이 문서는 자동 검증과 브라우저 검증의 출처를 분리한다. 브라우저 항목의 `대기`는 아직 검증되지 않았다는 뜻이며 통과로 해석하지 않는다.

## 자동 검증

| 항목 | 실행 명령 | 결과 | 비고 |
|---|---|---|---|
| 스토리 회귀 테스트 | `npm run test:story` | 통과 — 72/72, 실패 0 | 첫 샌드박스 실행은 `tsx` 임시 IPC 소켓 `listen EPERM`으로 중단돼, 동일 명령을 허용된 환경에서 다시 실행했다. |
| 타입 검사 | `npm run typecheck` | 통과 — exit 0 | `tsc --noEmit` |
| 프로덕션 빌드 | `npm run build` | 통과 — exit 0 | 첫 샌드박스 실행은 Google Fonts 네트워크 차단으로 실패했다. 네트워크 접근이 허용된 동일 명령에서 Next.js 16.2.12가 컴파일·TypeScript·13개 정적 페이지 생성을 완료했다. |
| 개발 서버 | `http://localhost:3000` | 컨트롤러 브라우저에서 `/` 200, `/api/guestbook` 200 | 검증 작업자의 격리된 셸에서는 포트가 공유되지 않아 `curl`이 연결 거부됐다. 중복 서버는 시작하지 않았다. |

자동 검증 중 개발 서버 로그에서 `/story/doodle-v2/01-opening-background.webp` LCP 이미지에 `loading="eager"` 권고가 기록됐다. 최종 판정 전에 첫 fallback/animated 이미지의 실제 loading 경로와 수정 결과를 별도 기록한다.

## Viewport 시각 검수

각 viewport에서 16개 숏의 시작·중간·끝을 관찰해 viewport당 48개 표본을 기록하고, 숏 1·4·6·9·10·11·12·13·15·16을 캡처한다. 아래 표의 각 viewport 셀은 `S(시작) · M(중간) · E(끝)` 세 결과와 실제 `data-shot`을 함께 담는다.

### 390×844

- 실제 viewport / DPR: 대기
- story top / height / travel: 대기
- 가로 overflow (`scrollWidth <= clientWidth`): 대기
- 캡처: 대기
- 16숏 start/mid/end: 대기
- 특이사항: 대기

### 430×932

- 실제 viewport / DPR: 대기
- story top / height / travel: 대기
- 가로 overflow (`scrollWidth <= clientWidth`): 대기
- 캡처: 대기
- 16숏 start/mid/end: 대기
- 특이사항: 대기

### 1280×720

- 실제 viewport / DPR: 대기
- story top / height / travel: 대기
- 가로 overflow (`scrollWidth <= clientWidth`): 대기
- 캡처: 대기
- 16숏 start/mid/end: 대기
- 특이사항: 대기

## 16숏 검사표

| # | 숏 | 구간 | 390×844 | 430×932 | 1280×720 |
|---:|---|---:|---|---|---|
| 1 | `island-opens` | 0–5% | 대기 | 대기 | 대기 |
| 2 | `sidecar-arrives` | 5–10% | 대기 | 대기 | 대기 |
| 3 | `same-direction` | 10–15% | 대기 | 대기 | 대기 |
| 4 | `paper-to-tower` | 15–21% | 대기 | 대기 | 대기 |
| 5 | `through-window` | 21–27% | 대기 | 대기 | 대기 |
| 6 | `awkward-desk` | 27–33% | 대기 | 대기 | 대기 |
| 7 | `joke-panel` | 33–39% | 대기 | 대기 | 대기 |
| 8 | `trying-not-to-laugh` | 39–45.5% | 대기 | 대기 | 대기 |
| 9 | `laugh-together` | 45.5–52% | 대기 | 대기 | 대기 |
| 10 | `postcards-open` | 52–58% | 대기 | 대기 | 대기 |
| 11 | `route-connects` | 58–64% | 대기 | 대기 | 대기 |
| 12 | `jeju-expands` | 64–70% | 대기 | 대기 | 대기 |
| 13 | `venue-approach` | 70–78% | 대기 | 대기 | 대기 |
| 14 | `outfit-matchcut` | 78–86% | 대기 | 대기 | 대기 |
| 15 | `everyone-arrives` | 86–93% | 대기 | 대기 | 대기 |
| 16 | `invitation-rises` | 93–100% | 대기 | 대기 | 대기 |

## 경계·역재생·점프·복원

### 15개 숏 경계 왕복

모든 경계에서 정방향과 역방향을 각각 확인한다. 공간형 연결 중 빈 프레임, 하드 풀프레임 crossfade, 숨은 레이어, 이전 transform 잔류가 없어야 한다.

- 결과: 대기

### 큰 점프

| 조작 | 요청 위치 | 실제 진행률 / 숏 | stale transform | 결과 |
|---|---:|---|---|---|
| top → 58% | 58% | 대기 | 대기 | 대기 |
| 58% → 12% | 12% | 대기 | 대기 | 대기 |
| bottom → top | 0% | 대기 | 대기 | 대기 |

### 새로고침·브라우저 복원

| 조작 | 요청 위치 | 실제 진행률 / 숏 | stale transform | 결과 |
|---|---:|---|---|---|
| 42%에서 새로고침 | 42% | 대기 | 대기 | 대기 |
| 82%에서 새로고침 | 82% | 대기 | 대기 | 대기 |
| 뒤로가기 복원 | 이전 위치 | 대기 | 대기 | 대기 |
| 앞으로가기 복원 | 이전 위치 | 대기 | 대기 | 대기 |

## 라우트·접근성·콘솔

| 검사 | 기대 | 결과 | 증거 |
|---|---|---|---|
| `/` | 16숏 스토리와 기본 청첩장 | 대기 | 대기 |
| `/i/not-a-valid-token` | 404 없이 편지 없는 기본 청첩장 | 대기 | 대기 |
| `/admin` | 로그인 또는 인증된 관리자 화면 | 대기 | 대기 |
| reduced motion | sticky/rAF 없이 최종 원화 6패널 | 대기 | 대기 |
| 콘솔 | 애플리케이션 오류 0건 | 대기 | 대기 |

## 시각 승인 기준

| 항목 | 결과 | 비고 |
|---|---|---|
| 공간 경계에서 blank 없음 | 대기 | |
| 공간 경계에서 hard full-frame crossfade 없음 | 대기 | |
| 주요 인물·소품 잘림 없음 | 대기 | |
| 래스터 이미지 안에 의도치 않은 글자 없음 | 대기 | |
| 비균일 확대에 따른 눈에 띄는 왜곡 없음 | 대기 | |
| 가로 overflow 없음 | 대기 | |
| 역방향·큰 점프 후 stale transform 없음 | 대기 | |
| 활성 숏의 필수 레이어가 숨지 않음 | 대기 | |
| laugh-burst ray와 triptych divider 정렬 | 대기 | |
| 첨부 레퍼런스의 흰 종이·굵은 검은 선·단순하고 귀여운 콩 캐릭터 스타일 일관성 | 대기 | |

## 감사(audit)

- story renderer placeholder 감사: 구현 매치 0건. 감사 결과를 설명하는 이 문장만 검색된다.
- 새 story 자산·구현의 `TODO`/`TBD`/placeholder 감사: 구현 매치 0건. 감사 결과를 설명하는 이 문장만 검색된다.
- worktree/브랜치 감사: 현재 `/Users/juju/Desktop/git-repository/wed-invi`, `codex/doodle-wedding-story`; 최종 상태 대기
- `git diff --check`: 통과 — 출력 없음

## 실기기에서만 확인 가능한 항목

다음 항목은 데스크톱 개발 환경 결과로 검증됐다고 주장하지 않는다.

- iOS Safari와 카카오톡 인앱 브라우저의 긴 sticky 섹션 체감
- 지도 앱 딥링크와 웹 폴백
- 주소·계좌 클립보드 복사
- `navigator.share`
- 카카오톡 공유와 링크 미리보기
- `.ics` 캘린더 연결
