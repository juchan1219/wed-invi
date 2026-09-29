# 최초 요구사항과 구현 현황

이 프로젝트가 왜 이렇게 만들어졌는지 남겨두는 문서입니다. 기능을 고치거나 뺄 때
"이건 원래 왜 있었나"를 여기서 확인하세요.

## 배경

시중 모바일 청첩장 서비스에 없는 두 가지가 필요해서 직접 만들었습니다.

1. **하객별 개인화 편지** — 하객마다 다른 URL을 발급하고, 그 사람에게 쓴 손편지를 보여준다
2. **사진 서빙 최적화** — 스튜디오 원본을 그대로 올리면 모바일에서 수 MB씩 내려받게 된다

비용은 전부 무료 티어 안에서 해결하는 것이 조건이었습니다.

---

## 요구사항 → 구현 매핑

### 춤과 캘린더 사이의 검은 줄 (2026-09-20 사용자 보고) ✅

요구: 춤 마지막 장면과 캘린더 섹션 사이에 검정 줄이 하나 보인다(진행률 막대로 보임).
춤이 끝나고 아래로 스크롤하면 검정이 아니라 **훨씬 연한 회색 선**이 되고,
명확하게 춤 장면이 있을 때만 진행률 막대로서 기존처럼 검정이어야 한다.

| 요구 | 구현 |
|---|---|
| 원인 | 진행률 막대(`.progress`)는 무대 바닥에서 1.1rem 위에 붙어 있다. 진행률 1에서 고정이 풀리면 **꽉 찬 검은 칠**(폭 100%, 높이 2px)이 무대와 함께 위로 밀려 올라와, 바로 아래에서 올라오는 캘린더와의 경계에 검은 줄처럼 보였다 |
| 춤이 끝나고 스크롤하면 연한 회색 | ✅ 두 번째 ScrollTrigger가 **고정이 풀린 지점부터**(`start: "bottom bottom"`) 화면 높이의 `DANCE_EXIT_FADE`(0.2)만큼 스크롤하는 동안 `--dance-exit`를 0→1로 올리고, 검은 칠의 `opacity`가 `1 - --dance-exit`로 걷힌다. 남는 것은 막대의 원래 바탕(`rgba(23,23,23,0.15)`) — 종이색 위에서 rgb(218,217,213)인 연한 회색 선이다 |
| 춤이 있을 때만 검정 | ✅ 고정 구간(진행률 0~1)에서는 `--dance-exit`가 항상 0이라 검은 칠이 그대로다. 진행률 1에 **머무는 동안**(편지 "건너뛰기"의 도착점)도 아직 0이라 다 찬 검은 막대로 보이고, 한 픽셀이라도 더 내려가야 연해지기 시작한다 |
| 되돌아오면 | ✅ 스크럽이라 위로 올리면 `--dance-exit`가 0으로 돌아와 다시 검정이 된다 |
| 왜 선을 아예 없애지 않았나 | 사용자가 "연한 회색 선으로"라고 지정했다. 남은 선이 춤과 캘린더 사이의 옅은 구분선 역할을 한다 |

- 동작 줄이기(`prefers-reduced-motion: reduce`)에서는 무대가 `display:none`이라 진행률 막대 자체가 없다 — 영향 없음.

### "{이름}님께 편지가 왔어요" — 접힌 편지지 3D 열기 (2026-09-19 사용자 요청) ✅

개인화 URL로 들어온 하객에게 편지가 있으면, 춤 마지막 장면에서 스크롤이 끝나기 직전(진행률 0.9 이상)
"초대드리고자 합니다" 아래에 "{이름}님께 편지가 왔어요" 버튼을 보여 준다. 누르면 반으로 접힌 편지지가 3D로 펼쳐지며 편지가 나온다.

| 요구 | 설계 |
|---|---|
| 편지 있을 때만 버튼 | `Invitation`의 `letter` prop → `LetterProvider` 컨텍스트. 잘못된 토큰·0통은 지금처럼 편지 없는 청첩장 |
| 버튼에 받는 사람 이름 (2차) | "{이름}님께 편지가 왔어요". 좁은 화면에서 넘치면 "님께" 뒤에서만 줄을 바꾼다 |
| 적절한 등장 애니메이션 | 16px 올라오며 450ms 페이드, 약 1초 뒤 **버튼 전체**가 ±3° 회전하며 두 번 흔들리고 멈춤(5초 안 — WCAG 2.2.2). 동작 줄이기면 흔들림 없음. 좌우로 미는 흔들림은 "틀렸다"(비밀번호 오류)로 읽혀 쓰지 않는다 |
| 접힌 편지지 3D 펼침 | 네이티브 `<dialog>` 안에서 위 절반(날개)이 아래 절반 위로 접혀 있다가 접힌 선을 축으로 `rotateX(-180°→0)` — **아래에서 위로** 펼쳐진다 (4차), perspective 1200px, 800ms. 펼친 뒤 평평한 편지로 바꾸고 글 페이드 인. **누를 때마다** 접힌 편지지부터 다시 펼친다 (2차) |
| 접힌 겉면은 실제 우편처럼 (4·5차) | 왼쪽 위 "To. {이름}님"(가장 크게), 오른쪽 위 우표(하트)와 예식 날짜 소인, 오른쪽 아래 "From. {작성자}"(크게). 4차엔 한국 봉투 관례(보내는 사람 왼쪽 위, 받는 사람 오른쪽 아래)를 따랐으나 5차 사용자 요청으로 받는 사람을 왼쪽 위로 옮겼다 |
| 편지가 잘 보이게 | 편지지 안에서 명조·넉넉한 줄간격, 종이 안에서만 스크롤. 기존 `LetterMarkdown`(XSS 방어 포함) 재사용 |
| 버튼이 그림을 가리지 않게 (2차에서 발견) | 이름이 들어가 버튼이 넓어지면서, 세로가 짧은 화면(카카오톡 인앱 추정 390×663·375×559)에서 버튼이 엔딩 그림의 머리·부케를 11~47px 덮었다. 버튼이 나타날 때 그림이 필요한 만큼만 아래로 비켜 주고(발끝은 스크롤 안내 위까지), 그래도 모자라면 최대 25%까지 줄인다(`getLetterRoom`). 넉넉한 화면에서는 움직이지 않는다 |

- 사용자 결정:
  - 본문에 펼쳐 두던 편지는 없앤다. 처음엔 같은 버튼을 단 본문 섹션으로 바꿨다가, 2차 요청으로 그 섹션도 없앴다.
    그 섹션이 맡던 두 경로는 이렇게 대신한다: 동작 줄이기 → 정적 카드 마지막 장 아래 같은 버튼,
    "댄스 이야기 건너뛰기" → 편지가 있으면 본문 대신 춤 마지막 장면(진행률 1, 버튼이 보임)으로 이동.
  - 편지가 2통이면 편지지 두 장("다음 편지"를 누르면 두 번째가 다시 펼쳐짐). 리서치의 탭 전환 대신 사용자 선택을 따른다.
  - 관리자 열람 기록은 페이지 열람 그대로 둔다(DB 변경 없음).
- 리서치로 정한 것:
  - 대화상자는 투명한 전체 화면 틀로 쓴다. 기본 `overflow:auto`가 3D를 깨기 때문이다.
  - `-webkit-backface-visibility`를 넣고, 겹침 깜빡임은 `translateZ(1px)`로 막는다.
  - 배경 탭 닫기는 직접 처리한다(Safari는 `closedby` 미지원).
  - 안드로이드 뒤로가기는 `history.pushState`로 처리한다.
  - 크기는 `svh` 기준이다(카카오톡의 `dvh` 불안정).
- 제외한 대안: iOS 스크롤 잠금용 `body{position:fixed}`. 스크롤 위치가 0이 되어 반투명 배경 뒤 춤이 첫 장면으로 튀기 때문이다. `<html>` `overflow:hidden`을 쓴다(실기기 확인 필요).
- 구현:
  - `src/components/letter/`: `LetterProvider`(컨텍스트·대화상자), `LetterDialog`(3D 편지지·순서·다음 편지), `LetterButton`(문구 `letterButtonLabel`), `LetterIcon`
  - `WeddingDance`: 무대 마지막 장면과 동작 줄이기 마지막 카드의 버튼, 건너뛰기 도착점(`getDanceSkipTarget`). 그림 비켜 주기는 `getLetterRoom`(`danceTimeline.ts`)을 `useDanceTimeline`이 크기가 바뀔 때만 재서 적용
  - 기존 `LetterSection`은 삭제했다. `LetterMarkdown`은 편지지 느낌으로 명조가 되었고, 관리자 미리보기도 같은 컴포넌트라 함께 바뀐다.
  - 순서: 올라오기 350ms → 소인 찍힘 200ms → 겉면 보여 주기 200ms → 펼침 650ms. 글은 펼침 30% 지점(종이가 약 84% 펼쳐진 때)부터 140ms 동안 나타난다. 도중에 탭하면 끝으로 건너뛴다.
- 변경 이력 (2026-09-19 2차 사용자 요청):
  - 버튼 문구: "편지가 있어요" → "{이름}님께 편지가 왔어요"
  - 흔들림: 봉투 아이콘 → 버튼 전체
  - 다시 열기: 펼친 편지를 바로 보여 주던 것 → 누를 때마다 접힌 편지지부터 펼침
  - 본문 편지 섹션(`LetterInvite`) 삭제
  - 작업 중 발견: 넓어진 버튼이 세로가 짧은 화면에서 엔딩 그림을 덮음 → 그림이 비켜 줌
- 변경 (2026-09-19 3차 사용자 요청): 편지를 읽은 뒤에도 버튼 아이콘은 **닫힌 봉투(하트 봉인) 그대로** 둔다.
  처음엔 누르면 열린 봉투로 바뀌었는데, 열린 봉투 아이콘은 쓰지 않으므로 `LetterIcon`에서 지웠다.
- 변경 (2026-09-19 4차 사용자 요청):
  - 펼치는 방향: 위에서 아래로 → **아래에서 위로**. 아래 절반이 고정되고 위 절반(날개)이 위로 펼쳐진다.
  - 접힌 겉면: 가운데 쌓았던 "To./봉인/From." → 우편 봉투 배치(보내는 사람·우표·소인·받는 사람)
  - 하트 봉인은 우표 안으로 옮겼다. 봉투 앞면에는 봉인이 없기 때문이다. 펼치기 전 봉인이 사라지던 순간은 소인이 찍히는 순간으로 바꿨다.
  - 세로가 짧은 화면(높이 580px 이하)에서는 봉투 요소를 줄인다. 320×500에서 소인과 받는 사람이 맞닿았기 때문이다.
- 변경 (2026-09-19 5차 사용자 요청):
  - 겉면 배치: 왼쪽 위 "To. 받는 사람"(더 크게), 오른쪽 아래 "From. 보내는 사람"(더 크게). "받는 사람/보내는 사람" 작은 제목은 뺐다.
  - 겉면을 1초 더 보여 준 뒤 펼친다.
  - 펼친 뒤 글이 늦게 보이던 문제: 펼침(800ms)이 끝난 뒤에야 300ms 페이드가 시작됐다.
    펼침 곡선의 뒤쪽 약 40%는 거의 움직이지 않는 안착 구간이어서, 빈 종이만 보이는 시간이 약 0.5초 있었다.
    → 종이가 거의 다 펼쳐진 45% 지점부터 글을 보여 준다.
- 변경 (2026-09-19 6차 사용자 요청): 겉면 보여 주기 1000 → 500ms. 글은 펼침 35% 지점부터 160ms로 더 일찍 보인다(이전 45%·220ms).
  글이 일찍 나타나면서, 아직 제자리로 내려오던 편지지 아래 가장자리가 평평한 편지 밑으로 회색 띠처럼 비쳤다(0.1초).
  그래서 편지지를 내리는 움직임을 글이 나타나는 시점(35%)에 맞춰 끝낸다. 날개는 그대로 끝까지 눕는다.
- 변경 (2026-09-19 7차 사용자 요청): 겉면 보여 주기 500 → 200ms. 글을 더 빨리 보이게 하려고 펼침 자체를 800 → 650ms로 빠르게 했다.
  글은 30% 지점부터 140ms 동안 나타난다. 글 시작만 앞당기면 종이가 눈에 띄게 반쯤 접힌 채(75%) 글이 겹쳐 보여서, 펼침 속도를 같이 올렸다.
- 검증: 로컬 DB 실제 경로(`/i/<토큰>`)에서 헤드리스 Chrome으로 확인했다. 상세 결과는 `todo.md`에 있다. 실기기 확인은 남았다.

#### 플로팅 편지 버튼 (2026-09-19 사용자 요청) ✅

편지가 있는 하객이 편지 버튼을 누르지 않고 스크롤을 내리면, 캘린더 섹션부터 오른쪽 위에 편지 아이콘만 있는 둥근 버튼을 띄운다.

| 요구 | 설계 |
|---|---|
| 편지가 있을 때만 | `LetterProvider` 안에서만 그린다. 편지 없는 청첩장(`/`·잘못된 토큰·0통)에는 버튼 요소 자체가 없다 |
| 캘린더 섹션부터 | 본문(`#invitation-content`, 첫 섹션이 캘린더) 윗변이 화면 위로 40px 지나가면 나타나고, 다시 올리면 사라진다. 같은 자리의 춤 "건너뛰기" 버튼은 음수 margin·transform 때문에 무대가 끝난 뒤에도 약 32px 더 남아 보여서, 그 뒤에 나타나게 했다(72px에서 겹침을 확인하고 고침) |
| 오른쪽 위 | 사이트 시트(26rem)의 오른쪽 위. 넓은 화면에서도 시트 밖으로 나가지 않는다. z-index 40(사진 크게 보기·토스트 50 아래) |
| 안 읽었으면 레드닷 + 좌우로 흔들기 | 빨간 점을 달고, 나타날 때 좌우로 기울며 두 번 흔들고 멈춘다(5초 안 — WCAG 2.2.2, 이 프로젝트 기준). 동작 줄이기면 흔들지 않는다 |
| 누르면 (2차 요청) | 편지를 바로 열지 않고, 춤 마지막 장면("CELEBRATE WITH US", 진행률 1)으로 스크롤해 "{이름}님께 편지가 왔어요" 버튼이 보이게 한다(동작 줄이기면 마지막 카드). 도착하면 그 버튼으로 초점을 옮기고 한 번 더 흔든다. 도착하면 본문 위라 플로팅 버튼은 저절로 사라진다 |
| 읽었으면 | 레드닷·흔들림 없이 버튼만 남는다(편지 버튼으로 가는 길) |
| 구현 | `LetterFab`(편지 분기에서만 렌더), 읽음 상태는 `LetterProvider`(`letterReadStamp`)가 관리한다 |
| 읽음 기준 | 편지를 한 번 열면 읽음. 이 기기에 저장(localStorage, 편지 쓴 사람 목록과 함께)해 다시 와도 유지된다. 새 편지가 추가되면 다시 "안 읽음"이 된다. 저장소를 못 쓰는 브라우저는 그 방문 동안만 기억한다 |

### 청첩장 댄스 문구 (2026-09-19 사용자 결정) ✅

신부 이름은 **이주은**(`src/config/wedding.ts`). 장면 문구(`danceTimeline.ts`의 `DANCE_SCENES`, `/` = 줄바꿈):

| 장면 | 영어 소제목 | 본문 |
|---|---|---|
| 1 손잡기 | WE ARE GETTING MARRIED | 김예찬 · 이주은 / 결혼합니다 |
| 2 펼치기 | SAVE THE DATE | 2026.12.19(토) 오후 12시 30분 / 잠실 아펠가모 (날짜·시간 한 줄, 2026-09-19 사용자 요청. 날짜·요일·시간·장소는 설정에서 파생) |
| 3 포옹 | TOGETHER | 바라만 봐도 웃음이 나는 / 사람을 만났습니다 |
| 4 턴 | HAND IN HAND | 그 손을 꼭 잡고 / 평생을 걸어가려 합니다 |
| 5 입맞춤 | WITH LOVE | 그 첫걸음을 / 따뜻하게 지켜봐 주세요 |
| 6 안아 들기·엔딩 | CELEBRATE WITH US | 소중한 인연에 감사드리며 / 기쁜 날, 초대드리고자 합니다 |

- 3~6번째는 여러 후보 세트(만남·같은 방향·시간과 약속 등) 중 사용자가 흐름을 보고 골랐다.
- 장소가 2번째로 옮겨 가면서 기존 4번째 장면의 "잠실 아펠가모 2층 단독홀"은 빠졌다. 홀 이름은 예식 정보·오시는 길 섹션에 있다.
- 영어 소제목은 한 줄(줄바꿈 금지)로 두고, 소제목·본문 모두 키운다.
  본문은 모든 장면이 같은 크기라, 가장 긴 줄("기쁜 날, 초대드리고자 합니다", 16자)이 320px 화면에서도 한 줄에 들어가는 크기가 상한이다.
  구현: 문구 상자를 무대 폭 전체로 넓혀 `\n`에서만 줄바꿈, 소제목 0.8rem·nowrap, 본문 `clamp(1.1rem, 5.5cqw, 1.7rem)`, top 18%.
- 모션 축소 정적 카드는 320px 폭에서만 소제목 "WE ARE GETTING MARRIED"가 2줄이다(todo에 기록).

### 웨딩 댄스 엔딩 — 최종 E안 (2026-09-19 사용자 결정) ✅

요구: 안아 들고 마주 본 뒤, 두 사람이 정면을 보며 눈웃음. 신랑은 한 팔로 신부를 안고 반대 팔을 대각선 위로,
신부는 부케를 든 팔을 대각선 위로. 신부 팔이 3개로 보이면 안 되고, 기존 프레임과 같은 비율이어야 한다.

- 춤은 기존 80프레임을 그대로 재생하고, 마지막 프레임(79, 안아 들고 마주 봄) 뒤에 엔딩 그림 한 장(프레임 80)을 잇는다.
  (2026-09-19 조정) 안고 마주 보는 모습이 너무 오래 보인다는 사용자 피드백으로, 일어선 채 안은 프레임(74~79)을 0.78~0.80에 빠르게 지나
  0.835까지만 유지하고, 마지막 문구가 다 나타나는 0.84부터 엔딩 그림으로 멈춘다(`DANCE_SEQUENCE`, 81프레임). 들어 올리며 일어서는 동작(63→74)은 이전과 같은 속도다.
- 엔딩 그림: `assets/dance-frames/ending.png`. ChatGPT로 생성했고 팔 4개·손 4개, 부케를 한 손에만 들었으며 입이 없음을 확인했다.
  `npm run dance:ending`이 이 그림을 `frames/dance-6.webp`(576px 한 칸, 17KB)로 만든다.
  - 신랑 키·신발 중심·바닥은 프레임 79와 같다(머리 위 127·바닥 546·신발 278.6 vs 127·546·278.9, 576px 칸).
  - 원본이 커서 그냥 줄이면 선이 1px 가늘다. 2배 크기에서 검은 선을 1px 넓힌 뒤 줄여 선 굵기(중앙값 5px)를 프레임과 맞췄다.
- 79 → 엔딩은 중간 동작 없이 한 번에 바뀐다(사용자 요청: 마지막 프레임이 끝난 뒤 이 그림). "우리, 결혼합니다" 문구가 떠 있는 동안 바뀐다.

### 비교 후 제외한 안 (2026-09-18~19) — 빠뜨린 것이 아님

같은 기간에 여러 안을 만들어 청첩장 상단 토글 버튼으로 비교했다. 사용자가 E안을 최종으로 고른 뒤
**토글 버튼과 아래 안들을 코드와 저장소에서 제거했다.** 이미지·스크립트·프롬프트 기록은
`~/Desktop/wed-invi-backup-2026-09-19/`에 백업했다(한 번도 커밋되지 않은 파일들이다).

| 안 | 내용 | 제외 이유 |
|---|---|---|
| A | 표정 수정: 작은 곡선 미소 | 사용자가 쓰지 않기로 함(기존 안 그림체는 입이 없음) |
| B | 표정 수정: 눈웃음·열린 웃음 | 사용자 요청으로 가장 먼저 제외 |
| C | 입 없이 눈 표정만 수정 | 사용자가 쓰지 않기로 함 |
| D | 부케 피날레 시트(v1 16칸 추가, 이후 들어 올리기 시트 교체 2종) | 신랑 상체 기울기(머리-발 가로차 20~33px·22px, 기존 안 8.7px), 이어지는 지점의 자세·크기 튐, "너무 이상함"(사용자) |

A·C 시트는 1254px 원본을 Real-ESRGAN 4배로 키운 뒤 576px 칸으로 줄였다(기존 안과 같은 방식). D 시트는 칸 간격이 불균일해
여백 기준으로 한 칸씩 잘랐다. 그 공용 로직(`scripts/dance/sheet-cells.mjs`)은 기존 안 atlas 생성에 계속 쓴다.

### 실제 관절 웨딩 댄스 (2026-09-18)

**후속 사용자 피드백으로 구현 방향 변경:** Rive 벡터 재작화의 캐릭터 동일성이
부족하여 기본 노출을 중단했다. 기술보다 원본 캐릭터·그림체 유지가 우선이다.
현재 기본 렌더러는 원본을 참조해 생성한 중간 동작 프레임 + canvas 시퀀스다.
Rive는 환경변수로만 켜는 실험 시안으로 보관한다. 아래 Rive 요구는 시도 이력이다.
프레임 생성 역시 원본 픽셀과 100% 동일하지 않으므로 캐릭터 동일성·동작 품질의
최종 사용자 시각 승인을 완료로 간주하지 않는다.

사용자가 첨부한 6포즈 웨딩 커플 원화를 시계방향 key pose로 사용한다.
이미지 좌표 이동·크로스페이드는 최종 춤이 아니다. Rive 벡터 캐릭터의 관절과
의상을 움직이는 실제 `.riv` 파일을 기본 렌더러로 제공한다.
손잡기 → 펼치기 → 가까이 안기 → 턴 → 포옹 → 안아 들기를 중간 동작으로 연결한다.
단일 `Dance.danceProgress`(0–100) 데이터 값으로 자세를 결정하여 역스크롤·점프를 지원한다.
드레스와 베일은 독립 변형하고, 스크롤 위치와 무관한 물리 시뮬레이션은 사용하지 않는다.
원화의 분위기를 참고해 리깅 가능한 벡터로 재작화하며 원본 픽셀을 그대로 움직이는 방식은 아니다.
모션 축소·로딩 실패에서는 원화 정적 그림과 청첩장 정보를 유지한다.

#### 모든 브라우저에서 모바일 비율 댄스 (2026-09-18 사용자 요청)

| 요구 | 구현 |
|---|---|
| 데스크톱·모바일 브라우저와 무관하게 인앱 브라우저처럼 **모바일 세로 비율**로 춤이 보일 것 | ✅ 댄스 섹션의 `100vw` 풀블리드를 없애 사이트 시트(26rem) 안에 둔다. stage를 `container-type: inline-size`로 만들고 크기·이동량·글자 크기를 `vw` 대신 `cqw`로, 뷰포트 media query를 `@container`로 바꿔 데스크톱에서도 휴대폰과 같은 구도가 된다 |
| 휴대폰 브라우저에서도 스크롤하면 춤출 것 (정적 포즈 목록이 아니라) | ✅ 원인은 개발 환경: 휴대폰은 `192.168.x.x:3000`으로 붙는데 Next 16이 dev 리소스를 cross-origin으로 보고 403을 내 hydration이 안 되어 `pending` 정적 목록에 머물렀다. `allowedDevOrigins`에 사설 IP 대역을 등록했다 (배포에는 영향 없음) |

- 기기 설정 "동작 줄이기"(`prefers-reduced-motion: reduce`)가 켜진 폰은 **의도적으로** 계속 정적 포즈 목록을 본다.
  접근성 설정을 존중하기 위한 선택이며, 누락이 아니다.
- **스크롤 계속 유도(2026-09-18 사용자 선택: 1안만)** — ✅ 조사 근거: NN/g "illusion of completeness".
  "아래로 스크롤 ↓" 안내를 stage가 풀리기 직전(`SCROLL_HINT_END` 0.97)까지 유지한다. 스크롤 중엔 opacity 0.3,
  2초 멈추면 다시 1로 올라가고 화살표가 오르내린다. 상태는 `getScrollHintState`(순수 함수, 테스트 고정)가 정하고
  `useDanceTimeline`이 stage의 `data-hint`로 반영한다. iOS Safari 하단 툴바는 safe-area에 잡히지 않아 바닥에서 띄웠다.
  제안했던 2안(진행 바 옆 "2 / 6" 장면 번호)과 3안(멈춤 감지 강조 효과)은 사용자가 **제외**했다.
  단순함 우선이고, 두 안 모두 효과를 뒷받침하는 정량 근거가 없었다.
- **댄스 캐릭터 화질(2026-09-18 사용자 요청)** — ✅ 원본 셀(약 313px)이 화면에서 약 1.9배 확대되어 흐렸다.
  `npm run dance:upscale`(Real-ESRGAN anime, 4배) → `npm run dance:frames`(576px 셀, WebP 품질 60)로 선을 또렷하게 하면서
  로딩 용량은 2.3MB → 1.7MB로 줄였다(사용자 조건: 화질을 올리되 파일이 커지면 안 됨). 720px 셀은 화면상 차이가 거의 없는데
  용량이 크게 늘어 제외했다. 벡터 변환(프레임마다 선 떨림 위험)과 재생성(캐릭터 동일성 위험)도 제외했다.
- **댄스 배경색(2026-09-19 사용자 요청)** — ✅ 무대 배경을 본문(캘린더·사진)과 같은 `--color-paper`(#fdfbf7) 단색으로 통일했다.
  바탕색은 원래 같았다. 다만 위에 덮인 종이 질감(점무늬 + 흰색→베이지 그라데이션) 때문에 왼쪽 위는 #fcfbf8, 오른쪽 아래는 #faf7f1로 보였다(헤드리스 Chrome 측정).
  그래서 질감 레이어를 없앴다. 프레임 그림은 투명 배경이라 그대로 쓴다. 바꾼 뒤 가장 많이 나온 색 기준으로 무대·캘린더·사진이 모두 #fdfbf7이다.
- 가로로 눕힌 휴대폰처럼 뷰포트 높이가 폭보다 작으면 stage도 가로로 넓어진다. 세로 비율을 강제로 고정하지는 않았다
  (청첩장은 세로 사용이 전제이고, 강제 letterbox는 오히려 춤이 작아진다).


### 1. 최적화된 사진 서빙 ✅

| 요구 | 구현 |
|---|---|
| 사진 용량 최적화 | `npm run photos:prep`(sharp) — EXIF 회전 반영, 긴 변 2400px, 메타데이터 제거 |
| 포맷·해상도 최적화 | `next/image` 정적 import → AVIF/WebP 자동 변환 + `srcset` + `blurDataURL` |

검증: `Accept` 헤더별로 AVIF 960B / WebP 1916B / JPEG 3656B 응답 확인.
Vercel 무료 한도(월 5,000회 변환) 대비 실사용 500회 안팎.

### 2. URL로 수신자를 구분하는 개인화 편지 ✅

| 요구 | 구현 |
|---|---|
| "이름+휴대폰 뒷 4자리"를 인코딩한 URL | `HMAC(TOKEN_SECRET, "이름\|뒷자리4")` → base64url 12자 → `/i/<토큰>` |
| 마크다운 렌더링 | `react-markdown` + `remark-gfm`, `rehype-sanitize`로 XSS 차단 |
| 이미지도 렌더링 | Vercel Blob 업로드 → 파일명에 크기를 박아 `next/image`로 최적화 |
| 관리자가 편지 작성 + 이름/뒷자리 입력해 저장 | `/admin/letters/new` |
| 작성 중 마크다운 프리뷰 | 작성/미리보기 탭. **청첩장과 같은 `LetterMarkdown` 컴포넌트를 공유**해 화면이 어긋나지 않음 |
| URL 발급·조회·관리 | `/admin` 목록에서 발급 URL 확인, 열람 여부 표시, 수정·삭제 |
| 관리자 2명(예찬·주은) chip으로 전환 | 헤더 chip이 목록 필터와 작성자를 함께 결정. localStorage로 화면 간 유지 |

**HMAC을 고른 이유**: 같은 입력이면 항상 같은 URL이라 하객이 링크를 잃어버려도 재발급이 안정적이고,
URL만 보고 이름을 역산하거나 다른 하객의 편지를 찍어서 열 수 없습니다.
이름의 공백 차이(`홍 길동` / `홍길동`)는 정규화로 흡수해 같은 하객에게 URL이 두 개 발급되는 사고를 막습니다.

#### 2-1. 모바일 관리자 + OS 공유 + 카카오톡 공유 ✅

- 모바일 우선 레이아웃, 공용 비밀번호 로그인(30일 세션 쿠키)
- `navigator.share`(OS 공유 시트) / `Kakao.Share.sendDefault` / 링크 복사
- 카카오톡 메시지 제목만 `"○○님, 저희 결혼합니다"`로 개인화

#### 2-2. 편지가 없으면 섹션 미노출 ✅

잘못된 토큰 · 미등록 하객 · 편지 0통 · 기본 URL — **전부 404 없이 평범한 청첩장**으로 렌더됩니다.
하객이 에러 화면을 보는 것보다 낫기 때문입니다. 7가지 경우를 검증했습니다.

### 3. 주소와 지도 ✅

- 지도 썸네일(사용자 제공 `photos/map.jpg`) + 식장명/홀/주소
- **네이버지도 / 카카오맵 / 티맵** 버튼 — 앱 스킴 우선, 1.2초 뒤 웹으로 폴백
- 주소 클립보드 복사, 예식장 전화 걸기, 교통편(지하철·버스·주차) 아코디언

### 4. 갤러리 ✅

3열 그리드 → 탭하면 전체화면 스와이프 뷰어(embla). 디자인 디테일은 직접 수정할 수 있게 마크업을 단순하게 유지했습니다.

### 5. 신랑측·신부측 계좌 복사 ✅

아코디언 2개, 항목별 복사 버튼(은행 앱에 붙여넣기 좋게 **숫자만** 복사), 카카오페이 송금 링크(선택).

### 6. 소셜 공유 미리보기 ✅

- OG 1200×630 자동 생성(`photos/og.jpg` 없으면 hero를 크롭)
- `htmlLimitedBots: /.*/` — 카카오톡 스크래퍼가 Next의 기본 봇 목록에 없어서, 스트리밍 메타데이터를 끄고 항상 `<head>`에 태그가 박히게 함
- **수신자 이름은 OG에 넣지 않음** — 링크가 제3자에게 전달돼도 이름이 노출되지 않도록

### 추가로 넣은 것 (역제안 → 채택)

- **D-day + 캘린더 저장** — 예식월 달력, 남은 일수, `.ics` 다운로드
- **방명록** — 4자리 비밀번호로 본인 삭제, 관리자 숨김/삭제
- **연락처** — 신랑·신부·혼주 전화/문자 바로가기, 고인은 자동 제외
- **6포즈 웨딩 댄스 스토리** — 사용자가 제공한 2×3 웨딩 커플 원화를 여섯 key pose로 사용한다.
  기존 7장면 영화적 스토리는 사용자 화면에서 비활성화하고, sticky stage 안에서 커플이 좌우를 오가며
  반대편 문구와 교차하는 짧은 스크롤 경험으로 교체한다. 첫 구현은 분리한 정적 pose 사이를 부드럽게
  전환하는 fallback이며, 최종 Rive rig는 같은 0~1 진행률 계약으로 교체할 수 있어야 한다.
- **영화적 스크롤 웨딩 스토리** — 레퍼런스의 71개 고유 자산·197개 트랙·538개 키프레임 구조를
  공개 번들과 브라우저에서 조사한 뒤, 기존 8개 합성 이미지의 줌·크로스페이드 방식을 전면 교체했다.
  `storyTimeline.ts`에 7개 공개 장면·7개 transcript 항목·41개 분리 레이어·100개 이상 키프레임을 선언하고,
  `useStoryTimeline.ts`가 네이티브 스크롤을 감쇠 재생 헤드로 샘플링해 transform·opacity를 직접 갱신한다.
  종이 찢김, polygon reveal, 패널 확대, 카메라 이동, 의상 매치컷, 위/아래 역재생과 큰 점프 보정을 포함한다.
  스토리는 430×932 단일 논리 모바일 좌표를 px로 샘플링하고, 레이어별 독립 `scaleX`·`scaleY`와
  `transform-origin`으로 화면 비율 차이를 흡수한다. `stageShell`의 `ResizeObserver`는 실제 shell 크기에서
  `min(width / 430, height / 932, 1)`을 CSS custom property로만 갱신해, React 재렌더 없이 고정 논리 plane을
  contain한다. 따라서 데스크톱의 여백은 크림색 종이로 남고 타임라인 좌표는 언제나 비스케일 430×932 px다.
  plane 안의 크기·오프셋·제목 drop 값도 이 논리 px/백분율만 사용하므로 바깥 viewport 단위가 다시 적용되거나
  두 번 스케일되지 않는다.
  프로포즈 3단 장면은 좌/중/우 크롭을 사용한다.
  꽃가루는 서로 다른 속도와 크기의 전·중·후경으로 나누고, 타이틀 글자와 웃음 표정도 장면별 독립 상태로 구성했다. 함부르크 프로포즈, 반지, 도쿄타워 사진은 원본을
  공개 경로에 복사하지 않고 동일 화풍의 355KB WebP 장면을 만드는 참고로만 썼다. reduced-motion에서는
  sticky를 제거하고 최종 레지스트리의 오프닝·사이드카·오피스·웃음·프로포즈·예식장·피날레 배경과 캐릭터·전경을
  장면별 정적 합성으로 읽기 순서대로 보여준다. 장면 2는 공개 cue 없이 그림만 노출하며 나머지도 승인된 cue만 표시한다.
  서버 HTML과 첫 client render는 모두 `data-motion="pending"`인 같은 비스티키 fallback이므로 hydration
  불일치나 빈 첫 프레임이 없고, layout effect가 모션 허용을 확인한 뒤에만 430×932 sticky stage·`ResizeObserver`·
  rAF timeline을 활성화한다. reduced motion이면 `height:auto`와 fallback을 계속 유지해 tall scroll/rAF를 만들지 않는다.
  JavaScript 실행 전에도 대체 화면과 건너뛰기 링크가 DOM에 존재하며, 스크린리더에는 7개 장면 전체 대본을 제공한다.
  모든 애니메이션 래스터는 `alt=""`, `aria-hidden="true"`, `tabIndex={-1}`인 장식물이고, skip link가 청첩장 본문의
  첫 interactive control보다 앞선다. 진행률의 `aria-valuenow`·`aria-valuetext`·live text는 매 프레임이 아니라
  장면 id가 바뀌는 7개 경계에서만 갱신된다. Next.js 16의 `preload`/`loading` 동시 사용 금지에 맞춰 오프닝 배경과
  첫 sidecar 캐릭터 합성만 preload하고 다른 애니메이션 이미지는 native lazy loading한다. 정적 fallback에서는 화면에
  먼저 보이는 제주 배경만 eager load하고 이후 합성 레이어는 lazy load한다.

  `codex/doodle-wedding-story` 변형의 rough checkpoint는 같은 타임라인을 유지하면서 사진풍 배경과
  사람형 캐릭터를 흰 종이·굵은 검은 선·점눈의 콩 캐릭터로 교체했다. 당시 제주·오피스·웃음·예식장·
  피날레 배경은 소수의 평면색과 삐뚤한 CSS 선화였고, 이후 아래의 최종 래스터 자산과 generic renderer로
  교체했다. 1280×720와 390×844·430×932에서 rough 오프닝·오피스·프로포즈 위치를
  실제 DOM viewport 및 PNG 크기로 확인했다. 다만 네트워크 제한으로 `npm run build`는 완료하지 못했으므로,
  production build 근거는 최종 아트로 승격하기 전의 남은 검증 항목이다.

  최종 아트 승격용 shots 1–6 자산은 2배수 430×932 배경 5개와 실제 alpha 전경 2개로 제작했다.
  오프닝·사이드카 도로·종이 전환·타워 카드·사무실 배경은 불투명 WebP, 사무실 desk는 alpha WebP,
  sidecar는 alpha PNG로 등록했으며 각 레지스트리 크기는 실제 파일 메타데이터와 테스트로 고정한다.
  41개 타임라인 레이어와 같은 순서의 선언형 renderer definition이 이 자산들을 소비하고, 이미지 크기·fit·
  focal point는 typed inline CSS custom property로 전달한다. sprite는 512px intrinsic atlas cell과 256px 논리 표시
  cell을 분리해 1024×512 표시 atlas를 정확한 row/column offset으로 이동한다. couple 레이어 하나 안에는 예찬·주은
  두 sprite를 선언형 part로 합성하고, wheel 레이어는 1024×768 sidecar에서 서로 다른 224×224 영역을 56×56으로
  crop한다. generic 선언형 parent-child layer tree가 두 wheel DOM을 sidecar 안에 각각 한 번만 렌더링하며, 기존
  `data-story-layer`와 timeline query 계약을 유지한다. wheel CSS 기준점은 sidecar contain box 안의 source crop center에서
  계산한 parent-relative 전륜 `(123.171875, 305.26828125)`와 후륜 `(383.5234375, 305.26828125)`이다. 두 wheel의
  local x/y는 0, local scale은 1이고 각 rotate track과 crop만 독립적으로 유지하므로 sidecar가 이동·확대·기울기를 단독으로
  소유한다. shots 1–6의 세부 안무는 오프닝 배경의 36px 이동, sidecar의 520→30px 진입과 두 casual sprite
  합성, 우하단 coral paper corner를 원점으로 한 0.15→2.4배 종이 확대, 0.72×0.58→1 tower card 진입,
  51%/43% 창 원점의 1→4.8배 camera zoom, 그 아래 1.35→1배 office background와 desk 연결로 구현했다.

  shots 7–16용 최종 자산은 430×932 좌·우 웃음 패널, 실제 alpha 웃음 burst, 세 개의 정확한
  430×932 크롭으로 구성된 1290×932 프로포즈 삼연작, 430×932 예식장 외부·내부, 실제 alpha
  좌·우 하객 전경과 veil/paper sweep으로 제작했다. 삼연작은 함부르크 프로포즈·실내 반지 공개·
  도쿄타워 웨딩 스냅의 사건과 콩 캐릭터 얼굴을 유지한다. 투명 전경은 새 neon-magenta source만
  chroma-key하고 nearest-opaque edge 색으로 오염을 제거했으며, 실제 크기·alpha coverage·배경 sample·
  bounds를 자산 테스트로 고정했다. 이 자산의 renderer 연결은 완료했으며
  shots 7–9는 왼쪽 joke panel의 -430→0px 진입, 오른쪽 laugh panel의 우측 polygon reveal, 독립 캐릭터
  sprite, 양 패널의 `scaleX: 0.5` 압축·합류, 중앙·무회전 handoff 상태의 0.2→1.6배 laugh burst로
  안무했다. burst ray와 proposal 삼연작 divider의 pixel-level 정렬은 unit test가 증명하지 않으며 Task 12
  브라우저/image QA에 남긴다. shots 10–12는 같은 1290×932 `proposalTriptych` DOM을 opacity 0.98 이상으로 유지한 채
  x `0→-430→-860px`로 이동하고, 가운데 반지 상자만 같은 원화의 `(464,340,248,300)` crop으로 복제해
  `0.8→1.12→1` pulse한다. 도쿄 패널은 tower 원점 기준 `1→1.8`배가 되고, `1.35`배 예식장 외부의 coral diagonal
  polygon reveal과 2% 겹친다. 원화의 venue arch x=210은 허용 오차가 아닌 source 기준점이며, 각각의 pan·origin·scale을
  적용한 handoff 좌표는 tower x=210.0, arch x=208.5로 실제 차이 1.5px다. 테스트는 이 두 변환값의 차이가 12px 이하인지 고정한다.
  diagonal wipe는 `venueExterior`를 재사용하는 clipped `venue-reveal`(stack 12)이 opaque
  `proposal-triptych`(stack 11) 위에서 progress `0.69–0.72`에만 그린다. `0.72`에서 외부가 full clip이 된 뒤
  duplicate가 꺼지고 같은 외부 underlay로 인계되므로 hard cut이 없으며, 이후 doorway reveal을 우회하지 않는다.
  `StoryLayer`가 소비하는 explicit `stack/coverage` 합성 계약에서 예식장 full interior(0) < exterior(1) < clipped
  interior doorway(2) 순서를 고정한다. full interior는 doorway가 완전히 열린 뒤에만 활성화되므로 exterior가 유지된 채
  중앙 polygon만 넓어진다. shots 1–3의 opaque `opening-field`는 shots 10–12 동안 opacity 0이라 높은 foreground stack으로
  triptych를 다시 덮지 않는다. 평상복 커플은 y `660→610px`로 문까지 실제 이동하고, 평상복·웨딩 sprite는 정확히
  progress `[0.8175, 0.8225)`의 정확한 0.5%에서만 같은 x/y/scale로 동시에 보인다.
  양쪽 하객은 `-180/+180px`에서 20px 차등 parallax로 들어오고 웨딩 커플은 y `610→470px`로 전진한다.
  마지막 veil/paper는 `(390,-180,.35)→(-40,-20,2.2)`로 쓸며 예식장 배경 clip을 중앙으로 닫아 cream canvas와
  일반 청첩장 본문 사이를 공간적으로 연결한다. 노출되는 canvas의 마지막 CSS cascade는 본문과 같은
  `var(--color-paper)`(`#fdfbf7`)를 사용한다. 390×844·430×932·1280×720 브라우저 합성 검수는
  [`2026-08-28-seven-scene-story-qa.md`](superpowers/evidence/2026-08-28-seven-scene-story-qa.md)에 기록했다. 렌더러 자체는 모든 장면을
  `next/image` 기반 장식 이미지, 정확한 sprite crop, 스크린리더 중복을 피하는 HTML text로만 구성하며 기존
  CSS 사람·건물·사이드카·군중·예식장 placeholder 분기를 제거했다.

  shots 1–9의 모든 경계와 최소 9→10 handoff는 전체 진행률 1.5% 구간에서 outgoing/incoming layer가
  각각 opacity 0.25를 넘긴다. 3→4는 paper scale, 4→5는 4.8배 camera zoom, 8→9는 polygon clip을
  사용하므로 전체 화면 opacity만 바꾸는 crossfade가 아니다. overlap 증명은 각 1.5% interval의 양 끝과 그 안의
  모든 opacity keyframe, hold discontinuity 양쪽을 검사한다. 지원 easing이 단조이므로 이 점들이 piecewise segment
  전체의 최솟값을 완전히 덮는다. 경계 전후 정방향·역방향 표본과 0.02↔0.58 직접 점프에서 실제 sequence가 반환한
  destination state는 direct baseline과 동일하다. sidecar 자식 wheel의 center를 parent origin 기준으로 scale·rotate하는
  순수 기하 검증은 progress 0.065·0.1·0.13·0.15를 고정하며, 0.15의 이전 sibling 모델 오차 10.9px 이상을 포착한다.
  shots 10–16도 각 경계의 visible spatial connector, triptych no-fade, 2% tower/venue overlap, 0.5% wardrobe overlap,
  정방향·역방향·`0.521↔0.999` 직접 점프 destination 동등성을 고정한다. proposal pan의 두 quarter-point는
  명시적 `easeInOut` 보간값을 검증한다. fallback registry/order, loading policy, pending/reduced presentation,
  shot-boundary announcement throttling, 실제 Next Image 장식/비포커스 SSR markup도 회귀 테스트로 고정한다.
  실제 `WeddingStory` SSR/mount 테스트는 pending fallback·skip target·7개 장면 transcript와 reduced-motion에서
  rAF/IntersectionObserver/ResizeObserver/scroll listener 0회, full-motion에서 containment/timeline observer 활성화를
  대조한다. SSR 테스트는 실제 CSS module 원문을 jsdom에 주입해 pending fallback의 계산된 `display:grid`와 stage의
  `display:none`까지 확인한다. 테스트 DOM은 README의 Node 20.9+ 계약을 지키는 `jsdom@26.1.0`에 exact pin했다.
  농담 장면은 말풍선 원화를 사용하지 않고 office 배경과 두 캐릭터·웃음 선만 합성하며, 렌더 가능한 HTML text는 승인된
  공개 cue allowlist로 고정한다. 반지 crop은 opaque proposal strip보다 높은 명시적 stack에서 합성한다. 같은 경로의
  브라우저 back/forward 복원은 현재 `history.state` 엔트리를 우선하고 session storage는 유효한 엔트리가 없을 때만 쓴다.
  `npm run test:story` 90개,
  `npm run typecheck`, `npm run build`를 통과했다. 최종 viewport 시각 검수와 브라우저 back/forward 복원은 같은 QA 증적에 기록했다.

  다음 검증은 이전 사진풍 scroll-story rebuild에 대한 결과다: `npm run test:story` 20개, `npm run typecheck`,
  `npm run build`, 1440×900·390×844의 주요 진행률
  스크린샷, 역스크롤·큰 점프·새로고침 복원, `/i/not-a-valid-token`, `/admin/login`, 브라우저 콘솔 오류
  0건까지 수행했다. 이 결과를 현재 doodle rough prototype의 production build 검증으로 해석하지 않는다.
  조사 근거는 `docs/scroll-story-reference-analysis.md`, 구현 계약은
  `docs/superpowers/specs/2026-08-14-scroll-wedding-story-rebuild-design.md`에 있다.
  낙서 테마의 규칙은 `docs/superpowers/specs/2026-08-14-doodle-wedding-story-theme.md`에 있다.

#### 현재 공개 스토리 계약과 검증

| 요구 | 현재 구현·검증 |
|---|---|
| 공개 서사 | 정확히 7개 장면(`jeju-opening`부터 `wedding-finale`)과 7개 transcript 항목. 장면 5는 두 순차 cue 사이의 의도된 무문구 구간을 가진다. |
| 장면 엔진 | 기존 41개 레이어 선언형 renderer와 100개 이상 keyframe이 430×932 논리 canvas를 구동한다. 종이 찢김·polygon reveal·카메라 줌·패널 확대·매치컷을 포함한다. |
| 정적 대체 | `STORY_FALLBACK_PANELS`의 7개 카드가 pending/reduced motion에서 같은 장면 순서로 렌더된다. reduced motion은 sticky·rAF·observer를 만들지 않는 자동 component/jsdom 검증으로 확인했다. 데스크톱 브라우저의 reduced-motion media emulation은 사용할 수 없었다. |
| 장소 문구 | 장면 6 문구는 `src/config/wedding.ts`의 예식 일시와 `wedding.venue.name`에서 서버·브라우저 동일하게 파생된다. |
| 복원 | 정상 scroll은 현재 history/session 기록을 보존하며, reload와 `back_forward`는 layout 완료 뒤 저장 진행률로 복원하고 늦은 browser drift 동안 persistence를 suspend한다. 42%·82% reload와 `/admin → back → forward` 0px 복원을 브라우저에서 확인했다. |
| 낙서 자산 | 기존 sidecar·두 rider·wheel crop, sprite 얼굴/비율, thick uneven ink와 colored-pencil/crayon 원화는 유지한다. scene 2 sidecar는 opaque road 위 stack으로 합성되며, `316dc3b`에서 midpoint canvas clipping을 수정해 두 인물과 두 바퀴가 논리 canvas 안에 들어온다. |
| 검증 | 390×844·430×932·1280×720의 21개 장면 표본, 경계 역방향·직접 jump·route fallback·콘솔을 QA 증적에 기록했다. scene 2 fixed recapture는 세 viewport 모두 p≈.13에서 opacity 1/z19 및 focal content 전체 노출을 확인했다. 개발 모드의 Next LCP advisory는 비차단 경고이며 애플리케이션 오류는 관찰되지 않았다. |
| 실기기 보류 | 데스크톱에서는 iOS/KakaoTalk in-app sticky 체감, 지도 앱 deep link, 클립보드, `navigator.share`, Kakao 공유·미리보기, `.ics` handoff를 검증하지 않았다. |

### 제안했으나 제외한 것

- **RSVP(참석 의사 전달)** — 논의 후 제외. 필요해지면 테이블 하나와 폼으로 추가 가능
- BGM, 화환 안내

---

## 기술 선택 근거

### Vercel + Supabase

> **2026-09-27: 이 결정은 한 번 뒤집혔습니다.** 원래는 Neon을 골랐고 Supabase를 명시적으로
> 제외했습니다. 아래에 원래 근거와 뒤집은 근거를 **둘 다** 남깁니다 — 나중에 "Supabase 검토를
> 빠뜨렸다"고 오해하지 않도록.

**원래 Supabase를 제외했던 이유 (2026-08)**

Supabase Free는 **7일간 DB 활동이 없으면 프로젝트를 일시정지**하고 대시보드에서 수동으로
Resume해야 합니다. 청첩장은 "개발 완료 → 실제 카톡 배포"까지 2주쯤 비는 게 흔한데,
그 사이 정지되면 첫 하객이 에러를 봅니다. 한 번뿐인 이벤트라 만회할 기회가 없습니다.

Neon은 5분 후 scale-to-zero → 다음 쿼리에 ~500ms 자동 복귀라 이 실패 모드가 없습니다.

**뒤집은 이유 (2026-09-27)**

- 일시정지는 **삭제가 아닙니다.** 데이터·스토리지가 보존되고 대시보드에서 복구됩니다.
  (2024-06-24 정책 변경으로 **정지 후 90일** 안에 복구해야 합니다.)
- GitHub Actions cron(`.github/workflows/keepalive.yml`)이 주기적으로 깨우면 정지 자체가
  일어나지 않습니다. 저장소 무활동 60일이면 cron이 비활성화되지만, GitHub이 사전 경고 메일을
  보내고 커밋 하나로 리셋됩니다.
- 사용자가 이 수동 관리를 감수하기로 결정했습니다.

덤으로 얻은 것: **로컬 개발이 단순해졌습니다.** Neon HTTP 드라이버 때문에 있던 중계 프록시
컨테이너가 사라지고 평범한 Postgres 하나만 남았습니다.

잃은 것: 이제 **방치하면 안 됩니다.** keepalive가 죽으면 7일 뒤 정지되고, 그 사실을 알려주는
것은 워크플로 실패 메일뿐입니다. Neon에는 없던 관리 부담입니다.

Supabase의 강점인 Auth·Realtime·Storage는 여전히 쓰지 않습니다(관리자 2명·공용 비밀번호).
편지 이미지도 Vercel Blob 그대로입니다.

CI의 `npm run typecheck`는 먼저 `next typegen`을 실행합니다. `next-env.d.ts`와 App Router의
`PageProps` 타입은 Next가 생성하고 Git에는 넣지 않으므로, 이 순서가 없으면 깨끗한 GitHub Actions
체크아웃에서 정적 이미지 import와 라우트 타입을 찾지 못합니다. 2026-09-29 실제 CI 실패와 같은
깨끗한 체크아웃을 로컬에서 재현해, 타입 생성 전 실패·생성 후 통과를 확인했습니다.

자세한 설계는 [superpowers/specs/2026-09-27-supabase-migration-design.md](superpowers/specs/2026-09-27-supabase-migration-design.md).

### 관리자 인증을 단순하게 둔 이유

사용자가 2명이고 서버에서 세션을 강제로 끊을 일이 없습니다. 지키는 대상도 "하객 명단과 편지"
수준이라 공용 비밀번호 + 서명 쿠키로 충분합니다. 대신 **비밀번호가 유일한 방어선**이므로
길게 잡아야 합니다([todo.md](todo.md)의 알려진 제약 참고).
